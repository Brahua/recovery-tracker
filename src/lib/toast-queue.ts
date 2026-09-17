export type ToastTone = "success" | "error";

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

export const toastDurationMs: Record<ToastTone, number> = {
  success: 4500,
  error: 6000,
};

const maxVisibleToasts = 3;

export function addToast(queue: Toast[], toast: Toast) {
  // Same message already on screen: replace it so it is re-announced once.
  const rest = queue.filter((item) => item.message !== toast.message);
  return [...rest, toast].slice(-maxVisibleToasts);
}

export function removeToast(queue: Toast[], id: number) {
  return queue.filter((item) => item.id !== id);
}
