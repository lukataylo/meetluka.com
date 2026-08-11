/**
 * Root-scope kill switch.
 *
 * Until this migration, meetluka.com/ served the OS-style portfolio, which
 * registers a Workbox service worker at `/sw.js` with scope `/` and precaches
 * the app shell. Every returning visitor still has that worker installed, and
 * it will keep answering navigations to `/` with the cached old shell — the new
 * site would simply never appear for them.
 *
 * Shipping this file at the same URL replaces that worker: the browser
 * revalidates the script on the next navigation, sees different bytes, installs
 * this, and on activation we drop every cache it owns, unregister ourselves and
 * reload any open tabs. From then on `/` is served from the network as normal.
 *
 * The retired app re-registers its own worker at `/os/sw.js`, scoped to `/os/`,
 * so the two no longer overlap. Keep this file until you are confident the
 * old worker is gone from the wild — deleting it early would 404 the update
 * check and leave the stale worker in place.
 */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })(),
  );
});
