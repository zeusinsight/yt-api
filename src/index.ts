import { app } from "./app";

const port = process.env.PORT || 3000;

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 YT API running on port ${port}`);
