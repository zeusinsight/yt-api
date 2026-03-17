import { Hono } from "hono";
import { extractVideoId, ytdlp } from "../utils";

export const comments = new Hono();

comments.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "Missing ?url parameter" }, 400);

  const videoId = extractVideoId(url);
  if (!videoId) return c.json({ error: "Invalid YouTube URL" }, 400);

  const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100);

  try {
    const raw = await ytdlp([
      "--dump-json",
      "--skip-download",
      "--write-comments",
      "--extractor-args",
      `youtube:max_comments=${limit}`,
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    const data = JSON.parse(raw);
    const comments = (data.comments || []).map((c: any) => ({
      author: c.author,
      text: c.text,
      likes: c.like_count,
      timestamp: c.timestamp,
      isHearted: c.is_favorited,
    }));

    return c.json({ videoId, count: comments.length, comments });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
