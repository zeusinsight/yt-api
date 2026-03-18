const mockVideoId = "dQw4w9WgXcQ";

export function isMockMode(): boolean {
  return process.env.YT_API_MOCK === "1";
}

export async function mockYtdlp(args: string[]): Promise<string> {
  const joined = args.join(" ");

  if (joined.includes("ytsearch")) {
    return [
      JSON.stringify({
        id: mockVideoId,
        title: "Rick Astley - Never Gonna Give You Up",
        url: `https://www.youtube.com/watch?v=${mockVideoId}`,
        duration: 213,
        view_count: 1600000000,
        uploader: "Rick Astley",
        thumbnails: [{ url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" }],
      }),
    ].join("\n");
  }

  if (joined.includes("--write-comments")) {
    return JSON.stringify({
      id: mockVideoId,
      comments: [
        {
          author: "Alice",
          text: "Still a classic.",
          like_count: 120,
          timestamp: 1710000000,
          is_favorited: false,
        },
      ],
    });
  }

  if (joined.includes("/about")) {
    return JSON.stringify({
      id: "@MrBeast",
      channel_id: "UC38IQsAvIsxxjztdMZQtwHA",
      channel: "Rick Astley",
      title: "Rick Astley",
      channel_follower_count: 123456,
      channel_url: "https://www.youtube.com/@RickAstley",
      description: "Official channel",
    });
  }

  const lastArg = args[args.length - 1] || "";
  const match = lastArg.match(/([a-zA-Z0-9_-]{11})/);
  const videoId = match?.[1] || mockVideoId;

  return JSON.stringify({
    id: videoId,
    title: "Rick Astley - Never Gonna Give You Up",
    description: "Official music video",
    duration: 213,
    view_count: 1600000000,
    like_count: 17000000,
    upload_date: "20091025",
    uploader: "Rick Astley",
    channel_id: "UC38IQsAvIsxxjztdMZQtwHA",
    channel_url: "https://www.youtube.com/channel/UC38IQsAvIsxxjztdMZQtwHA",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    tags: ["pop", "80s"],
    categories: ["Music"],
    chapters: [],
    formats: [
      {
        format_id: "18",
        ext: "mp4",
        resolution: "360p",
        filesize: 12345678,
      },
    ],
  });
}

export async function mockTranscript(
  videoId: string,
  lang: string
): Promise<Array<{ text: string; duration: number; offset: number; lang: string }>> {
  const resolvedLang = lang === "fr" ? "en" : lang;

  return [
    {
      text: `Mock transcript for ${videoId}`,
      duration: 2,
      offset: 0,
      lang: resolvedLang,
    },
    {
      text: "This is a cached test response.",
      duration: 3,
      offset: 2,
      lang: resolvedLang,
    },
  ];
}
