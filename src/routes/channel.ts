import { Hono } from "hono";
import { remember } from "../lib/cache";
import { respondWithError } from "../lib/errors";
import { ytdlp } from "../utils";

export const channel = new Hono();

channel.get("/", async (c) => {
  const name = c.req.query("name") || c.req.query("url");
  if (!name) return c.json({ error: "Missing ?name parameter" }, 400);

  const channelPath = name.startsWith("http")
    ? name
    : `https://www.youtube.com/@${name.replace(/^@/, "")}/videos`;

  try {
    const raw = await remember(
      `channel:${name}`,
      1000 * 60 * 60 * 24,
      async () =>
        ytdlp([
          "--dump-json",
          "--flat-playlist",
          "--no-download",
          "--playlist-end",
          "1",
          channelPath,
        ])
    );

    const firstLine = raw.split("\n")[0];
    const data = JSON.parse(firstLine);

    return c.json({
      channelId: data.channel_id,
      name: data.channel,
      channel: data.channel,
      uploader: data.uploader,
      channelUrl: data.channel_url,
      description: data.description,
    });
  } catch (error) {
    const normalized = respondWithError("channel", error, { name });
    return c.json(normalized.body, normalized.status);
  }
});
