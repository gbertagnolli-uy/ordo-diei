// Service worker de Ordo Diei (lane 204): solo avisos push. No guarda nada en caché a propósito:
// así nunca queda una versión vieja de la app.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let aviso = { title: "Ordo Diei", body: "", url: "/dashboard", tag: "ordo-diei" };
  try {
    aviso = { ...aviso, ...event.data.json() };
  } catch {
    // aviso sin formato: se muestra el valor por defecto
  }
  event.waitUntil(
    self.registration.showNotification(aviso.title, {
      body: aviso.body,
      tag: aviso.tag,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: aviso.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ("focus" in v) {
          v.navigate(url).catch(() => {});
          return v.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
