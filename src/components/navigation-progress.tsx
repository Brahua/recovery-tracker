"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { pendingStore } from "@/lib/pending-store";

const showDelayMs = 120;

export function usePendingCount() {
  return useSyncExternalStore(pendingStore.subscribe, pendingStore.getSnapshot, () => 0);
}

export function NavigationProgress() {
  const busy = usePendingCount() > 0;
  const [delayElapsed, setDelayElapsed] = useState(false);
  const visible = busy && delayElapsed;

  // Wait a moment before showing so instant round-trips don't flash the bar.
  useEffect(() => {
    if (!busy) return;
    const timeout = window.setTimeout(() => setDelayElapsed(true), showDelayMs);
    return () => {
      window.clearTimeout(timeout);
      setDelayElapsed(false);
    };
  }, [busy]);

  return (
    <div
      aria-busy={visible}
      aria-hidden={!visible}
      className={`rr-progress ${visible ? "is-active" : ""}`}
      data-testid="global-progress"
    >
      <span />
    </div>
  );
}
