"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  addToast,
  removeToast,
  toastDurationMs,
  type Toast,
  type ToastTone,
} from "@/lib/toast-queue";

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((tone: ToastTone, message: string) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((queue) => addToast(queue, { id, message, tone }));
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((queue) => removeToast(queue, id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport onDismiss={dismiss} toasts={toasts} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);

  // A manual popover lives in the top layer, so toasts stay visible above an
  // open <dialog> sheet. Re-showing it moves it above the most recent dialog.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof viewport.showPopover !== "function") return;

    if (viewport.matches(":popover-open")) viewport.hidePopover();
    if (toasts.length > 0) viewport.showPopover();
  }, [toasts]);

  return (
    <div className="rr-toast-viewport" popover="manual" ref={viewportRef}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} onDismiss={onDismiss} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), toastDurationMs[toast.tone]);
    return () => window.clearTimeout(timeout);
  }, [toast.id, toast.tone, onDismiss]);

  return (
    <div
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
      className={`rr-toast rr-toast--${toast.tone}`}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <span aria-hidden="true" className="rr-toast-icon">
        {toast.tone === "error" ? "!" : "✓"}
      </span>
      <p>{toast.message}</p>
      <button aria-label="Cerrar aviso" onClick={() => onDismiss(toast.id)} type="button">
        ×
      </button>
    </div>
  );
}
