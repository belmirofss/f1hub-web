// F1HUB service worker, written by hand (no build plugin). Registered by
// components/layout/ServiceWorker.tsx in production only.
//
// - Install: precaches /offline with the CSS, JS and fonts it loads, and the
//   icons.
// - Pages: network first. After 3s, or when the network fails, the saved
//   copy, then /offline. Client-side navigations don't load a document, so
//   the page also sends each URL it shows here to be saved.
// - /_next/static, fonts and images: stale-while-revalidate.
// - Everything else goes straight to the network: /api, RSC requests,
//   radio clips and anything cross-origin.
//
// The registration URL carries the deployment's version (/sw.js?v=<sha>), so
// each deployment installs a new worker with its own caches. The new worker
// waits until the page asks it to take over on the next navigation, then
// deletes the old version's caches.

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";

const PRECACHE = `f1hub-precache-${VERSION}`;
const RUNTIME = `f1hub-runtime-${VERSION}`;
// components/offline/SavedPages.tsx lists this cache by its prefix
const PAGES = `f1hub-pages-${VERSION}`;

const OFFLINE_URL = "/offline";
const NAVIGATION_TIMEOUT = 3000;
const MAX_RUNTIME_ENTRIES = 150;
const MAX_PAGES = 40;
// A page saved more recently than this isn't fetched again for the list
const RESAVE_AFTER = 5 * 60 * 1000;

const ICONS = [
  "/icons/icon-96.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/manifest.webmanifest",
];

// Asset URLs in the offline page's HTML: the CSS and JS chunks and preloaded
// fonts under /_next/static (the \\ stops at the escaped quotes in the RSC
// payload), and the hashed icon links (/icon.png?abc123).
const STATIC_PATTERN = /\/_next\/static\/[^"'\s()<>\\]+/g;
const ICON_PATTERN = /href="(\/[^"]+\.(?:png|ico|svg)(?:\?[^"]*)?)"/g;
// Font files referenced by the CSS
const CSS_URL_PATTERN = /url\((\/_next\/static\/[^)]+)\)/g;

const matches = (text, pattern, group = 0) =>
  Array.from(text.matchAll(pattern), (match) => match[group]);

const precache = async () => {
  const cache = await caches.open(PRECACHE);
  const response = await fetch(OFFLINE_URL, { cache: "reload" });
  if (!response.ok) throw new Error(`${OFFLINE_URL}: ${response.status}`);
  const html = await response.clone().text();

  const assets = new Set([
    ...ICONS,
    ...matches(html, STATIC_PATTERN),
    ...matches(html, ICON_PATTERN, 1),
  ]);
  for (const url of assets) {
    if (!/\.css(\?|$)/.test(url)) continue;
    const css = await (await fetch(url)).text();
    matches(css, CSS_URL_PATTERN, 1).forEach((font) => assets.add(font));
  }

  // One missing asset shouldn't cost the whole offline fallback
  await Promise.allSettled([...assets].map((url) => cache.add(url)));
  await cache.put(OFFLINE_URL, response);
};

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const current = [PRECACHE, RUNTIME, PAGES];
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) => name.startsWith("f1hub-") && !current.includes(name),
          )
          .map((name) => caches.delete(name)),
      );
      await self.registration.navigationPreload?.enable();
      await self.clients.claim();
    })(),
  );
});

// From components/layout/ServiceWorker.tsx on every navigation
self.addEventListener("message", (event) => {
  // Only once this version is waiting: the next navigation hands over to it
  if (event.data === "activate") self.skipWaiting();
  if (event.data?.type === "save") {
    event.waitUntil(resavePage(event.data.url).catch(() => {}));
  }
});

// Oldest entries first: put() moves a refreshed entry to the end
const trim = async (cache, max) => {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, -max).map((request) => cache.delete(request)),
  );
};

// The home screen app opens /?source=pwa, which is the same page as /
const pageKey = (href) => {
  const url = new URL(href);
  url.searchParams.delete("source");
  url.hash = "";
  return url.href;
};

const isSavable = (response, key) =>
  response.status === 200 &&
  response.type === "basic" &&
  !response.redirected &&
  new URL(key).pathname !== OFFLINE_URL &&
  (response.headers.get("content-type") || "").includes("text/html");

// Keeps the title and the time it was saved in headers, for the list on
// /offline. Header values must be ASCII, hence the encoding.
const savePage = async (key, response) => {
  const body = await response.arrayBuffer();
  const html = new TextDecoder().decode(body);
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];

  const headers = new Headers(response.headers);
  // The body is already decoded
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.set("x-f1hub-saved-at", String(Date.now()));
  if (title) headers.set("x-f1hub-title", encodeURIComponent(title));

  const cache = await caches.open(PAGES);
  await cache.put(
    key,
    new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  );
  await trim(cache, MAX_PAGES);
};

// The page the client just navigated to without loading a document
const resavePage = async (href) => {
  const key = pageKey(href);
  if (new URL(key).origin !== self.location.origin) return;

  const saved = await caches.match(key, { cacheName: PAGES });
  const age = Date.now() - Number(saved?.headers.get("x-f1hub-saved-at"));
  if (age < RESAVE_AFTER) return;

  const response = await fetch(key, { headers: { Accept: "text/html" } });
  if (isSavable(response, key)) await savePage(key, response);
};

const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms),
  );

const navigate = async (event) => {
  const key = pageKey(event.request.url);

  // The page streams to the browser while a copy is saved in the background
  const network = Promise.resolve(event.preloadResponse)
    .then((preloaded) => preloaded || fetch(event.request))
    .then((response) => {
      if (isSavable(response, key)) {
        event.waitUntil(savePage(key, response.clone()).catch(() => {}));
      }
      return response;
    });
  // A slow response still refreshes the saved copy after it's been served
  event.waitUntil(network.catch(() => {}));

  try {
    return await Promise.race([network, timeout(NAVIGATION_TIMEOUT)]);
  } catch {
    const saved = await caches.match(key, { cacheName: PAGES });
    if (saved) return saved;
    try {
      return await network;
    } catch {
      return (
        (await caches.match(OFFLINE_URL, { cacheName: PRECACHE })) ||
        Response.error()
      );
    }
  }
};

const staleWhileRevalidate = async (event) => {
  const { request } = event;
  const cached = await caches.match(request);

  const network = fetch(request).then((response) => {
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      event.waitUntil(
        caches
          .open(RUNTIME)
          .then(async (cache) => {
            await cache.put(request, copy);
            await trim(cache, MAX_RUNTIME_ENTRIES);
          })
          .catch(() => {}),
      );
    }
    return response;
  });

  if (!cached) return network;
  event.waitUntil(network.catch(() => {}));
  return cached;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(event));
    return;
  }

  // Media streams with range requests, which a cache can't answer
  if (request.headers.has("range")) return;

  if (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
