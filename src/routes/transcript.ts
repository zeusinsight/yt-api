import { Hono } from "hono";
import { YoutubeTranscript } from "youtube-transcript-plus";
import { extractVideoId } from "../utils";

export const transcript = new Hono();

transcript.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "Missing ?url parameter" }, 400);

  const videoId = extractVideoId(url);
  if (!videoId) return c.json({ error: "Invalid YouTube URL" }, 400);

  const lang = c.req.query("lang") || "en";

  try {
    const result = await YoutubeTranscript.fetchTranscript(videoId, { lang });

    const fullText = result.map((s) => s.text).join(" ");

    return c.json({
      videoId,
      lang,
      segments: result,
      fullText,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});
