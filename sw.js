// Service worker de Cap : coquille de l'app en cache, tout fonctionne hors ligne.
const V = 'cap-v1'
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg']).catch(() => {}))) })
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', e => {
  const r = e.request
  if (r.method !== 'GET') return
  // réseau d'abord pour la navigation (récupère les mises à jour), cache en secours
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put('./index.html', c)); return res }).catch(() => caches.match('./index.html')))
    return
  }
  // reste : cache d'abord, puis réseau (met à jour en arrière-plan)
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(V).then(x => x.put(r, c)) } return res }).catch(() => hit)
    return hit || net
  }))
})
// Rappels : affiche la notification demandée par la page
self.addEventListener('message', e => { if (e.data && e.data.type === 'notify') self.registration.showNotification(e.data.title, { body: e.data.body, icon: './icon-192.png', tag: e.data.tag }) })
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(l => l[0] ? l[0].focus() : self.clients.openWindow('./'))) })
