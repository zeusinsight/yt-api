import { Hono } from "hono";
import { ytdlp } from "../utils";

export const search = new Hono();

search.get("/", async (c) => {
  const q = c.req.query("q");
  if (!q) return c.json({ error: "Missing ?q parameter" }, 400);

  const limit = Math.min(parseInt(c.req.query("limit") || "10"), 50);

  try {
    const raw = await ytdlp([
      "--dump-json",
      "--flat-playlist",
      "--no-download",
      `ytsearch${limit}:${q}`,
    ]);

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
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
