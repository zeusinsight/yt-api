import { Hono } from "hono";
import { remember } from "../lib/cache";
import { jsonError } from "../lib/errors";
import { ytdlp } from "../utils";

export const channel = new Hono();

channel.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "Missing ?url parameter" }, 400);

  try {
    const raw = await remember(
      `channel:${url}`,
      1000 * 60 * 60 * 24,
      async () =>
        ytdlp([
          "--dump-json",
          "--flat-playlist",
          "--no-download",
          "--playlist-end",
          "1",
          `${url}/videos`,
        ])
    );

    const firstLine = raw.split("\n")[0];
    const data = JSON.parse(firstLine);

    return c.json({
      channelId: data.channel_id,
      channel: data.channel,
      uploader: data.uploader,
      channelUrl: data.channel_url,
      description: data.description,
    });
  } catch (error) {
    const normalized = jsonError(error);
    return c.json(normalized.body, normalized.status);
  }
});
