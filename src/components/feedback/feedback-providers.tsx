"use client";

import { ToastProvider } from "@/components/feedback/toast-provider";
import { NavigationProgress } from "@/components/navigation-progress";

export function FeedbackProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <NavigationProgress />
      {children}
    </ToastProvider>
  );
}
