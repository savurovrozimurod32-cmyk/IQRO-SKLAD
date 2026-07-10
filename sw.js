/* IQRO — javon to'ldirish ro'yxati
   Kesh strategiyasi:
   - index.html: avval tarmoq. Sayt yangilansa, darhol yangi versiya keladi.
   - xlsx kutubxonasi va ikonkalar: avval kesh. 881 KB har safar yuklanmaydi.
   VERSIYA o'zgarsa, eski kesh o'chiriladi. */
const VERSIYA = 'iqro-v1';
const ASOSIY = ['./', './index.html', './xlsx.full.min.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSIYA).then(c => c.addAll(ASOSIY)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== VERSIYA).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const htmlSorovi = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (htmlSorovi) {
    // avval tarmoq, uzilsa keshdan
    e.respondWith(
      fetch(req)
        .then(r => { const n = r.clone(); caches.open(VERSIYA).then(c => c.put(req, n)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // qolgani: avval kesh
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const n = res.clone();
        caches.open(VERSIYA).then(c => c.put(req, n));
      }
      return res;
    }))
  );
});
