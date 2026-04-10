self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title || 'Nueva Cita', {
      body: data.body,
      icon: '/images/logos/icon-192.png',
      badge: '/images/logos/icon-192.png',
      data: { url: '/admin/citas' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/admin/citas'))
})
