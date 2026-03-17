import { Hono } from "hono";
import { ytdlp } from "../utils";

export const channel = new Hono();

channel.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "Missing ?url parameter" }, 400);

  try {
    const raw = await ytdlp([
      "--dump-json",
      "--flat-playlist",
      "--no-download",
      "--playlist-end",
      "1",
      `${url}/videos`,
    ]);

    const firstLine = raw.split("\n")[0];
    const data = JSON.parse(firstLine);

    return c.json({
      channelId: data.channel_id,
      channel: data.channel,
      uploader: data.uploader,
      channelUrl: data.channel_url,
      description: data.description,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
