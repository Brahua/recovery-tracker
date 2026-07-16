import Link from "next/link";

import {
  getAuthCallbackErrorCopy,
  normalizeAuthCallbackReason,
} from "@/lib/auth-callback-error";

export default async function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const copy = getAuthCallbackErrorCopy(normalizeAuthCallbackReason(reason));

  return (
    <main className="rr-theme min-h-screen px-5 py-6 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col justify-center rounded-[28px] border border-[var(--rr-border-hero)] bg-[var(--rr-card-bg)] p-6 shadow-2xl sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--rr-accent-light)]">
          Recovery Tracker
        </p>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.02em] text-[var(--rr-ink)] sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--rr-text-body)]">
          {copy.description}
        </p>
        <Link className="rr-button rr-button--primary mt-8 w-fit px-6" href="/">
          Volver e intentar de nuevo
        </Link>
      </section>
    </main>
  );
}
