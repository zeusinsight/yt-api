import { Hono } from "hono";
import { cors } from "hono/cors";
import { transcript } from "./routes/transcript";
import { info } from "./routes/info";
import { search } from "./routes/search";
import { comments } from "./routes/comments";
import { channel } from "./routes/channel";

export const app = new Hono();

app.use("*", cors());

app.get("/", (c) =>
  c.json({
    name: "YouTube API",
    version: "1.0.0",
    endpoints: [
      "GET /transcript?url={videoUrl}&lang={lang}",
      "GET /info?url={videoUrl}",
      "GET /search?q={query}&limit={limit}",
      "GET /comments?url={videoUrl}",
      "GET /channel?name={channelName}",
    ],
  })
);

app.route("/transcript", transcript);
app.route("/info", info);
app.route("/search", search);
app.route("/comments", comments);
app.route("/channel", channel);
