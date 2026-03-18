import { Hono } from "hono";
import { remember } from "../lib/cache";
import { respondWithError } from "../lib/errors";
import { ytdlp } from "../utils";

export const channel = new Hono();

channel.get("/", async (c) => {
  const name = c.req.query("name") || c.req.query("url");
  if (!name) return c.json({ error: "Missing ?name parameter" }, 400);

  const handle = name.startsWith("http")
    ? null
    : name.replace(/^@/, "");
  const channelPath = name.startsWith("http")
    ? name.includes("/about")
      ? name
      : `${name.replace(/\/$/, "")}/about`
    : `https://www.youtube.com/@${handle}/about`;
  const channelUrl = name.startsWith("http")
    ? name.replace(/\/about\/?$/, "")
    : `https://www.youtube.com/@${handle}`;

  try {
    const raw = await remember(
      `channel:${name}`,
      1000 * 60 * 60 * 24,
      async () =>
        ytdlp(["--dump-single-json", "--no-download", channelPath])
    );

    const data = JSON.parse(raw);

    return c.json({
      channelId: data.channel_id,
      name: data.channel || data.title,
      channel: data.channel || data.title,
      uploader: data.channel || data.title,
      channelUrl: data.channel_url || channelUrl,
      subscribers: data.channel_follower_count,
      description: data.description,
    });
  } catch (error) {
    const normalized = respondWithError("channel", error, { name });
    return c.json(normalized.body, normalized.status);
  }
});
