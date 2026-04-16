if (!self.define) {
  let e,
    n = {};
  const s = (s, i) => (
    (s = new URL(s + ".js", i).href),
    n[s] ||
      new Promise((n) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = s), (e.onload = n), document.head.appendChild(e));
        } else ((e = s), importScripts(s), n());
      }).then(() => {
        let e = n[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, c) => {
    const o =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (n[o]) return;
    let t = {};
    const r = (e) => s(e, o),
      d = { module: { uri: o }, exports: t, require: r };
    n[o] = Promise.all(i.map((e) => d[e] || r(e))).then((e) => (c(...e), t));
  };
}
define(["./workbox-1d305bb8"], function (e) {
  "use strict";
  (self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "registerSW.js", revision: "1872c500de691dce40960bb85481de07" },
        { url: "index.html", revision: "09e620f001400fcc94b8622c85947723" },
        { url: "icon-512.png", revision: "5f42ca55dcee0cd7fe30dbdee1668794" },
        { url: "icon-192.png", revision: "8d6a4dafd603f51d43719adb1f554e1e" },
        { url: "favicon.svg", revision: "e6a3cbacb411f7bd4b32d30496cf14c5" },
        { url: "assets/index-DOj6Satw.js", revision: null },
        { url: "assets/index-9hP-WxcD.css", revision: null },
        { url: "favicon.svg", revision: "e6a3cbacb411f7bd4b32d30496cf14c5" },
        { url: "icon-192.png", revision: "8d6a4dafd603f51d43719adb1f554e1e" },
        { url: "icon-512.png", revision: "5f42ca55dcee0cd7fe30dbdee1668794" },
        {
          url: "manifest.webmanifest",
          revision: "9b60cdf43130a67347889b88d8b56a8a",
        },
      ],
      {},
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      new e.NavigationRoute(e.createHandlerBoundToURL("index.html")),
    ),
    e.registerRoute(
      /^https:\/\/fonts\.googleapis\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.gstatic\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "gstatic-fonts-cache",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      "GET",
    ));
});
