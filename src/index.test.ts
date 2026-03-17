import { test, expect, describe } from "bun:test";

process.env.YT_API_MOCK = "1";

const { app } = await import("./app");

const req = (path: string) => app.request(path);

describe("GET /", () => {
  test("returns API info", async () => {
    const res = await req("/");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.name).toBe("YouTube API");
    expect(data.endpoints.length).toBe(5);
  });
});

describe("GET /transcript", () => {
  test("400 without url param", async () => {
    const res = await req("/transcript");
    expect(res.status).toBe(400);
  });

  test("400 for invalid url", async () => {
    const res = await req("/transcript?url=not-valid-id-xx");
    expect(res.status).toBe(400);
  });

  test("returns transcript for a real video", async () => {
    const res = await req("/transcript?url=dQw4w9WgXcQ");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.videoId).toBe("dQw4w9WgXcQ");
    expect(data.segments.length).toBeGreaterThan(0);
    expect(data.fullText.length).toBeGreaterThan(10);
  }, 15000);

  test("supports full YouTube URL", async () => {
    const res = await req(
      "/transcript?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.videoId).toBe("dQw4w9WgXcQ");
  }, 15000);

  test("supports youtu.be short URL", async () => {
    const res = await req("/transcript?url=https://youtu.be/dQw4w9WgXcQ");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.videoId).toBe("dQw4w9WgXcQ");
  }, 15000);
});

describe("GET /info", () => {
  test("400 without url param", async () => {
    const res = await req("/info");
    expect(res.status).toBe(400);
  });

  test("returns video info", async () => {
    const res = await req("/info?url=dQw4w9WgXcQ");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.videoId).toBe("dQw4w9WgXcQ");
    expect(data.title).toBeString();
    expect(data.duration).toBeNumber();
    expect(data.uploader).toBeString();
  }, 30000);
});

describe("GET /search", () => {
  test("400 without q param", async () => {
    const res = await req("/search");
    expect(res.status).toBe(400);
  });

  test("returns search results", async () => {
    const res = await req("/search?q=rick+astley&limit=3");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.query).toBe("rick astley");
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.results.length).toBeLessThanOrEqual(3);
    expect(data.results[0].title).toBeString();
  }, 30000);
});

describe("GET /comments", () => {
  test("400 without url param", async () => {
    const res = await req("/comments");
    expect(res.status).toBe(400);
  });

  test("returns comments for a video", async () => {
    const res = await req("/comments?url=dQw4w9WgXcQ&limit=5");
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.videoId).toBe("dQw4w9WgXcQ");
    expect(data.comments).toBeArray();
  }, 60000);
});

describe("GET /channel", () => {
  test("400 without url param", async () => {
    const res = await req("/channel");
    expect(res.status).toBe(400);
  });
});
