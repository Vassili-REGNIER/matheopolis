const path = require("node:path");
const liveServer = require("live-server");
const noCache = require("../live-server.middleware.cjs");

const publicRoot = path.join(__dirname, "..", "public");
const port = Number.parseInt(process.env.PORT ?? "5173", 10);

liveServer.start({
  port,
  host: "0.0.0.0",
  root: publicRoot,
  open: false,
  file: "index.html",
  // Paths are relative to the frontend package root (Docker working_dir = /app).
  watch: [
    "public/dist",
    "public/index.html",
    "public/global.css",
    "public/assets",
    "public/content",
    "public/mocks",
    "public/api",
    "scripts/dev-server.cjs",
  ],
  proxy: [["/api", "http://backend:80/api"]],
  middleware: [noCache],
});
