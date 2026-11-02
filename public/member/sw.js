const shell = "moremi-shell-v1";
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(shell)
      .then((c) => c.addAll(["/member/offline.html", "/member/offline.js"]))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (u.origin !== self.location.origin || event.request.method !== "GET")
    return;
  if (u.pathname.startsWith("/member/saved/")) {
    event.respondWith(
      caches
        .open("moremi-personal")
        .then((c) => c.match(event.request))
        .then(
          (r) => r || new Response("Worksheet unavailable", { status: 404 }),
        ),
    );
    return;
  }
  if (["/member/offline.html", "/member/offline.js"].includes(u.pathname)) {
    event.respondWith(
      caches
        .open(shell)
        .then((c) => c.match(event.request))
        .then((r) => r || fetch(event.request)),
    );
    return;
  }
  if (event.request.mode === "navigate")
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/member/offline.html")),
    );
});
