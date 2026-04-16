if (!self.define) {
  let e,
    s = {};
  const n = (n, i) => (
    (n = new URL(n + ".js", i).href),
    s[n] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = n), (e.onload = s), document.head.appendChild(e));
        } else ((e = n), importScripts(n), s());
      }).then(() => {
        let e = s[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, r) => {
    const o =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[o]) return;
    let t = {};
    const l = (e) => n(e, o),
      c = { module: { uri: o }, exports: t, require: l };
    s[o] = Promise.all(i.map((e) => c[e] || l(e))).then((e) => (r(...e), t));
  };
}
define(["./workbox-1d305bb8"], function (e) {
  "use strict";
  (self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "registerSW.js", revision: "1872c500de691dce40960bb85481de07" },
        { url: "index.html", revision: "e442a72e51a69c4ff0ca1f78921522ac" },
        { url: "icon-512.png", revision: "5f42ca55dcee0cd7fe30dbdee1668794" },
        { url: "icon-192.png", revision: "8d6a4dafd603f51d43719adb1f554e1e" },
        { url: "favicon.svg", revision: "c4bb29f562b61f36b056440ccc8e3b7a" },
        { url: "assets/recharts-D2k_uu8S.js", revision: null },
        { url: "assets/react-BFlpv9MX.js", revision: null },
        { url: "assets/Overview-CawjbFCu.js", revision: null },
        { url: "assets/motion-CvEhWXXX.js", revision: null },
        { url: "assets/Lookup-BrDOpjdd.js", revision: null },
        { url: "assets/LHDView-HhmHuGim.js", revision: null },
        { url: "assets/index-CvnRVAdy.css", revision: null },
        { url: "assets/index-BjdOoHGe.js", revision: null },
        { url: "assets/Explorer-sOdls7HO.js", revision: null },
        { url: "assets/CohortAnalyser-mYu6nnNI.js", revision: null },
        { url: "favicon.svg", revision: "c4bb29f562b61f36b056440ccc8e3b7a" },
        { url: "icon-192.png", revision: "8d6a4dafd603f51d43719adb1f554e1e" },
        { url: "icon-512.png", revision: "5f42ca55dcee0cd7fe30dbdee1668794" },
        {
          url: "manifest.webmanifest",
          revision: "e773e8ef359bcc132bb8258bb2751e7a",
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
