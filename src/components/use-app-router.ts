"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

import { useReportPending } from "@/components/feedback/use-report-pending";

// useRouter whose push/replace keep the global progress bar active until the
// destination has rendered.
export function useAppRouter() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useReportPending(pending);

  const push = useCallback(
    (href: string) => startTransition(() => router.push(href)),
    [router],
  );
  const replace = useCallback(
    (href: string) => startTransition(() => router.replace(href)),
    [router],
  );

  return useMemo(() => ({ pending, push, replace }), [pending, push, replace]);
}
