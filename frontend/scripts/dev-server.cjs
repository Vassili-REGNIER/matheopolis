const path = require("node:path");
const liveServer = require("live-server");
const noCache = require("../live-server.middleware.cjs");

const root = path.join(__dirname, "..");

liveServer.start({
  port: 5173,
  host: "0.0.0.0",
  root,
  open: false,
  file: "index.html",
  watch: ["dist", "index.html", "global.css", "mocks", "public"],
  proxy: [["/api", "http://backend:80/api"]],
  middleware: [noCache],
});
