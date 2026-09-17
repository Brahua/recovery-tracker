"use client";

import { useCallback, useTransition } from "react";

import { useToast } from "@/components/feedback/toast-provider";
import { resolveActionOutcome, resolveThrownOutcome } from "@/lib/action-feedback";
import { pendingStore } from "@/lib/pending-store";

interface ActionResultLike {
  ok?: boolean;
  error?: string | null;
}

interface RunOptions<Result> {
  success: string | ((result: Result) => string);
  fallbackError: string;
  onSuccess?: (result: Result) => void;
  onError?: (message: string) => void;
}

// Runs a server action with the global progress bar, a success toast, inline
// validation errors (via onError) and an error toast when the call throws.
export function useActionFeedback() {
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <Result extends ActionResultLike>(
      action: () => Promise<Result>,
      { success, fallbackError, onSuccess, onError }: RunOptions<Result>,
    ) => {
      onError?.("");
      const end = pendingStore.begin();

      startTransition(async () => {
        try {
          const result = await action();
          const outcome = resolveActionOutcome(result, fallbackError);

          if (outcome.kind === "success") {
            toast.success(typeof success === "function" ? success(result) : success);
            onSuccess?.(result);
          } else {
            onError?.(outcome.message);
          }
        } catch (error) {
          toast.error(resolveThrownOutcome(error).message);
        } finally {
          end();
        }
      });
    },
    [toast],
  );

  return { pending, run };
}
