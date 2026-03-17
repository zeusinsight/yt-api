import { Hono } from "hono";
import { remember } from "../lib/cache";
import { respondWithError } from "../lib/errors";
import { extractVideoId, ytdlp } from "../utils";

export const info = new Hono();

info.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "Missing ?url parameter" }, 400);

  const videoId = extractVideoId(url);
  if (!videoId) return c.json({ error: "Invalid YouTube URL" }, 400);

  try {
    const raw = await remember(`info:${videoId}`, 1000 * 60 * 60 * 24, async () =>
      ytdlp([
        "--dump-json",
        "--no-download",
        `https://www.youtube.com/watch?v=${videoId}`,
      ])
    );

    const data = JSON.parse(raw);

    return c.json({
      videoId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      viewCount: data.view_count,
      likeCount: data.like_count,
      uploadDate: data.upload_date,
      uploader: data.uploader,
      channelId: data.channel_id,
      channelUrl: data.channel_url,
      thumbnail: data.thumbnail,
      tags: data.tags,
      categories: data.categories,
      chapters: data.chapters,
      formats: data.formats?.map((f: any) => ({
        formatId: f.format_id,
        ext: f.ext,
        resolution: f.resolution,
        filesize: f.filesize,
      })),
    });
  } catch (error) {
    const normalized = respondWithError("info", error, { videoId });
    return c.json(normalized.body, normalized.status);
  }
});
