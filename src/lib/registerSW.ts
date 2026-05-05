// Guarded Service Worker registration.
// Skips registration in iframes / Lovable preview hosts to avoid stale caches.

export const registerServiceWorker = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();

  const host = window.location.hostname;
  const isPreview =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isInIframe || isPreview) {
    // Cleanup any previously registered SW in preview/iframe
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Auto-update
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              nw.postMessage("SKIP_WAITING");
            }
          });
        });
        // Check updates every 30 min
        setInterval(() => reg.update().catch(() => {}), 30 * 60_000);
      })
      .catch((err) => console.warn("[SW] register failed", err));
  });
};

// Push notification helpers
export const requestPushPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const subscribeToPush = async (vapidPublicKey?: string) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  if (!vapidPublicKey) return null;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
  return sub;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}
