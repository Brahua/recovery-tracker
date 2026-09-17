"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

import { useReportPending } from "@/components/feedback/use-report-pending";

function PendingReporter() {
  useReportPending(useLinkStatus().pending);
  return null;
}

// Drop-in replacement for next/link that feeds the global progress bar while
// the navigation waits on the server. Import this instead of next/link.
export default function AppLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingReporter />
    </Link>
  );
}
