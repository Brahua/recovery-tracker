"use client";

import { useEffect } from "react";

import { useToast } from "@/components/feedback/toast-provider";

interface ToastOnMountProps {
  message: string;
  // Stable id of what was saved; the toast shows once per id, even on reload.
  onceKey: string;
}

// For saves that finish with a server redirect, where no client callback runs.
export function ToastOnMount({ message, onceKey }: ToastOnMountProps) {
  const toast = useToast();

  useEffect(() => {
    const storageKey = `rr-toast:${onceKey}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Storage unavailable (private mode): showing it again is harmless.
    }
    toast.success(message);
  }, [message, onceKey, toast]);

  return null;
}
