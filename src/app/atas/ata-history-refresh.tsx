"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AtaHistoryRefresh({ at }: { at?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!at) return;
    const refreshAt = Date.parse(at);
    if (!Number.isFinite(refreshAt)) return;

    let refreshed = false;
    const refreshIfDue = () => {
      if (refreshed || document.visibilityState !== "visible" || Date.now() < refreshAt) return;
      refreshed = true;
      router.refresh();
    };
    const delay = Math.max(0, refreshAt - Date.now());
    const timeout = setTimeout(refreshIfDue, delay + 50);
    document.addEventListener("visibilitychange", refreshIfDue);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("visibilitychange", refreshIfDue);
    };
  }, [at, router]);

  return null;
}
