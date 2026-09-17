"use client";

import { useFormStatus } from "react-dom";

import { useReportPending } from "@/components/feedback/use-report-pending";

// Place inside a <form> whose action runs on the server.
export function FormPendingReporter() {
  useReportPending(useFormStatus().pending);
  return null;
}
