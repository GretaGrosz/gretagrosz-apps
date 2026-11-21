// Greta's inbox: shows a notification for every new message (pushed by worker/site.js) and opens it on tap.
// Nothing is cached: the inbox always shows what is on the server.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let m = {}
  try { m = e.data ? e.data.json() : {} } catch (x) { m = { title: 'New message', body: e.data ? e.data.text() : '' } }
  e.waitUntil(self.registration.showNotification(m.title || 'New message', {
    body: m.body || '',
    tag: m.tag || 'site',
    data: { url: m.url || '/inbox/' },
    icon: '/img/apple-touch-icon.png',
    badge: '/img/apple-touch-icon.png',
  }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL((e.notification.data && e.notification.data.url) || '/inbox/', self.location.origin).href
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = all.find((c) => c.url.startsWith(self.location.origin + '/inbox/'))
    if (open) { await open.focus(); open.postMessage({ open: url }); return }
    await self.clients.openWindow(url)
  })())
})
