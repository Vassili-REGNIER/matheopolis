/** Dev-only: prevent the browser from serving stale JS/CSS while live-server reloads. */
module.exports = function liveServerNoCacheMiddleware(_req, res, next) {
  const path = _req.url?.split("?")[0] ?? "";

  if (/\.(?:js|html|css)$/i.test(path)) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
};
