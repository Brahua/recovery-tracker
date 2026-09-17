"use client";

import { useEffect } from "react";

import { pendingStore } from "@/lib/pending-store";

// Mirrors a local pending flag (transition, form status, link status) into the
// global progress bar.
export function useReportPending(pending: boolean) {
  useEffect(() => {
    if (!pending) return;
    return pendingStore.begin();
  }, [pending]);
}
