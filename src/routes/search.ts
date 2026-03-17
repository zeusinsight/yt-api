import { Hono } from "hono";
import { remember } from "../lib/cache";
import { respondWithError } from "../lib/errors";
import { ytdlp } from "../utils";

export const search = new Hono();

search.get("/", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "Missing ?q parameter" }, 400);

  const limit = Math.min(parseInt(c.req.query("limit") || "10"), 50);

  try {
    const raw = await remember(
      `search:${limit}:${q}`,
      1000 * 60 * 30,
      async () =>
        ytdlp([
          "--dump-json",
          "--flat-playlist",
          "--no-download",
          `ytsearch${limit}:${q}`,
        ])
    );

    const results = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const d = JSON.parse(line);
        return {
          videoId: d.id,
          title: d.title,
          url: d.url,
          duration: d.duration,
          viewCount: d.view_count,
          uploader: d.uploader,
          thumbnail: d.thumbnails?.[0]?.url,
        };
      });

    return c.json({ query: q, count: results.length, results });
  } catch (error) {
    const normalized = respondWithError("search", error, { query: q, limit });
    return c.json(normalized.body, normalized.status);
  }
});
