// 錢途 Service Worker — Network-First 策略
// HTML/JS 優先抓網路新版，離線時才用快取備援
// 圖示與 manifest 用快取優先（幾乎不變）
const CACHE_NAME = 'qiantú-v6';
const STATIC_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // 靜態資源（圖示、manifest）→ 快取優先
  if (STATIC_ASSETS.some(a => url.pathname.endsWith(a.replace('./', '')))) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // HTML 與其他所有請求 → 網路優先，失敗才用快取
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功拿到新版，順便更新快取
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
