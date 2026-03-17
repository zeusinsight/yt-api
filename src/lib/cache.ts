import { RedisClient } from "bun";

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
}

type CacheEntry = {
  value: string;
  expiresAt: number;
};

class MemoryCache implements CacheStore {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}

class RedisCache implements CacheStore {
  private readonly client: RedisClient;
  private disabled = false;

  constructor(
    private readonly prefix: string,
    redisUrl: string
  ) {
    this.client = new RedisClient(redisUrl);
  }

  private keyFor(key: string) {
    return `${this.prefix}${key}`;
  }

  private disable(error: unknown) {
    this.disabled = true;
    console.warn(
      "[cache] Redis cache disabled, falling back to memory:",
      error instanceof Error ? error.message : String(error)
    );
  }

  async get(key: string): Promise<string | null> {
    if (this.disabled) return null;

    try {
      return await this.client.get(this.keyFor(key));
    } catch (error) {
      this.disable(error);
      return null;
    }
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    if (this.disabled) return;

    try {
      const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
      await this.client.setex(this.keyFor(key), ttlSeconds, value);
    } catch (error) {
      this.disable(error);
    }
  }
}

class HybridCache implements CacheStore {
  private readonly memory = new MemoryCache();
  private readonly redis?: RedisCache;

  constructor() {
    const redisUrl =
      process.env.REDIS_URL || process.env.VALKEY_URL || undefined;

    if (redisUrl) {
      this.redis = new RedisCache("yt-api:", redisUrl);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) {
      const cached = await this.redis.get(key);
      if (cached !== null) return cached;
    }

    return this.memory.get(key);
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    await this.memory.set(key, value, ttlMs);
    if (this.redis) {
      await this.redis.set(key, value, ttlMs);
    }
  }
}

export const cache = new HybridCache();

const inFlight = new Map<string, Promise<unknown>>();

export async function remember<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const cached = await cache.get(key);
  if (cached !== null) return JSON.parse(cached) as T;

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async (): Promise<T> => {
    try {
      const value = await loader();
      await cache.set(key, JSON.stringify(value), ttlMs);
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}
