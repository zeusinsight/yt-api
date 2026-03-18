type ProxyInput = string | undefined;

export function getProxyUrl(input?: ProxyInput): string | null {
  const value =
    input ||
    process.env.PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    null;

  if (!value) return null;

  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `http://${value}`;
}

export function hasProxy(): boolean {
  return getProxyUrl() !== null;
}

export function proxyFetch(init?: RequestInit) {
  const proxy = getProxyUrl();
  return async (url: string, options: RequestInit = {}) =>
    fetch(url, {
      ...init,
      ...options,
      proxy: proxy ?? undefined,
    });
}
