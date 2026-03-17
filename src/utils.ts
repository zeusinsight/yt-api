import { normalizeYtDlpError } from "./lib/errors";
import { isMockMode, mockYtdlp } from "./lib/mock";

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // raw ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function ytdlp(args: string[]): Promise<string> {
  if (isMockMode()) {
    return mockYtdlp(args);
  }

  const proc = Bun.spawn(["yt-dlp", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = new Response(proc.stdout).text();
  const stderr = new Response(proc.stderr).text();
  const code = await proc.exited;
  const [out, err] = await Promise.all([stdout, stderr]);

  if (code !== 0) {
    throw normalizeYtDlpError(err || `yt-dlp exited with ${code}`);
  }

  return out.trim();
}
