"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { savePushSubscription, deletePushSubscription } from "@/lib/push/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

export function PushNotificationsToggle() {
  const { dict } = useDictionary();
  const [status, setStatus] = useState<Status>("checking");
  const [pending, startTransition] = useTransition();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) setStatus(sub ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey]);

  async function enable() {
    if (!vapidPublicKey) return;
    const reg = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      return;
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

    startTransition(() => {
      savePushSubscription({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      }).then(() => setStatus("on"));
    });
  }

  async function disable() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) {
      setStatus("off");
      return;
    }
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    startTransition(() => {
      deletePushSubscription(endpoint).then(() => setStatus("off"));
    });
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return <p className="text-sm text-brand-text-muted">{dict.settings.pushUnsupported}</p>;
  }

  if (status === "denied") {
    return <p className="text-sm text-brand-text-muted">{dict.settings.pushDenied}</p>;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-brand-ink">{dict.settings.pushDescription}</p>
      <Button
        variant={status === "on" ? "secondary" : "primary"}
        size="sm"
        disabled={pending}
        onClick={() => (status === "on" ? disable() : enable())}
      >
        {status === "on" ? dict.settings.pushDisable : dict.settings.pushEnable}
      </Button>
    </div>
  );
}
