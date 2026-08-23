// Minimal service worker: only handles push display + notification clicks.
// No offline caching — that's a separate concern from push notifications.

self.addEventListener("push", (event) => {
  let payload = { title: "ALGORITM", body: "" };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "ALGORITM", body: event.data.text() };
    }
  }

  const options = {
    body: payload.body || "",
    icon: "/brand/logo.png",
    badge: "/brand/logo.png",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(payload.title || "ALGORITM", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
