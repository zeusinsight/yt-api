import { Hono } from "hono";
import {
  fetchTranscript,
  YoutubeTranscriptNotAvailableLanguageError,
} from "youtube-transcript-plus";
import { remember } from "../lib/cache";
import { jsonError, normalizeTranscriptError } from "../lib/errors";
import { isMockMode, mockTranscript } from "../lib/mock";
import { extractVideoId } from "../utils";

export const transcript = new Hono();

transcript.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) return c.json({ error: "Missing ?url parameter" }, 400);

  const videoId = extractVideoId(url);
  if (!videoId) return c.json({ error: "Invalid YouTube URL" }, 400);

  const lang = c.req.query("lang") || "en";

  try {
    const payload = await remember(
      `transcript:${videoId}:${lang}`,
      1000 * 60 * 60 * 24,
      async () => {
        if (isMockMode()) {
          const segments = await mockTranscript(videoId, lang);
          return {
            requestedLang: lang,
            resolvedLang: segments[0]?.lang || lang,
            fallbackUsed: lang === "fr",
            segments,
          };
        }

        try {
          const segments = await fetchTranscript(videoId, { lang });
          return {
            requestedLang: lang,
            resolvedLang: segments[0]?.lang || lang,
            fallbackUsed: false,
            segments,
          };
        } catch (error) {
          if (!(error instanceof YoutubeTranscriptNotAvailableLanguageError)) {
            throw error;
          }

          const segments = await fetchTranscript(videoId);
          return {
            requestedLang: lang,
            resolvedLang: segments[0]?.lang || "unknown",
            fallbackUsed: true,
            segments,
          };
        }
      }
    );

    const fullText = payload.segments.map((s) => s.text).join(" ");

    return c.json({
      videoId,
      requestedLang: payload.requestedLang,
      lang: payload.resolvedLang,
      fallbackUsed: payload.fallbackUsed,
      segments: payload.segments,
      fullText,
    });
  } catch (error) {
    const normalized = jsonError(normalizeTranscriptError(error));
    return c.json(normalized.body, normalized.status);
  }
});
