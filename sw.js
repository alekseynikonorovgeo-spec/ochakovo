// ═══ ОЧАКОВО Конструктор отчёта — Service Worker ═══
// При обновлении HTML или иконок — увеличивайте номер версии (v4 → v5 → v6 ...)
// чтобы новая версия гарантированно скачалась у всех прорабов.

const CACHE_NAME = 'ochakovo-v50';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

// Установка — кешируем все статические файлы.
// БЕЗ skipWaiting() — новый SW будет ждать пока пользователь нажмёт "Обновить сейчас"
// в баннере (или закроет все вкладки приложения).
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// Получили сообщение от приложения — пользователь нажал "Обновить сейчас"
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Активация — удаляем старые версии кеша
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Перехват запросов: сначала из сети (если есть), иначе из кеша.
// "Network-first" — чтобы прораб всегда видел свежую версию когда есть интернет.
// Если интернета нет — отдаём из кеша, отчёт работает офлайн.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Успешный ответ — обновляем кеш
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => 
        // Сети нет — отдаём из кеша
        caches.match(event.request).then(cached => 
          cached || caches.match('./index.html')
        )
      )
  );
});
