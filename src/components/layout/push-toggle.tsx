"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";
import { toast } from "sonner";

export function PushToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isPushSubscribed().then(setSubscribed);
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
        toast.success("알림 해제됨");
      } else {
        const ok = await subscribeToPush();
        if (ok) {
          setSubscribed(true);
          toast.success("알림 활성화!");
        } else {
          toast.error("알림 권한이 필요합니다");
        }
      }
    } catch {
      toast.error("알림 설정 실패");
    }
    setLoading(false);
  };

  // Push not supported
  if (typeof window === "undefined" || !("PushManager" in (typeof window !== "undefined" ? window : {}))) {
    return null;
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      title={subscribed ? "알림 끄기" : "알림 켜기"}
    >
      {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
    </button>
  );
}
