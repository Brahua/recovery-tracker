import Link from "next/link";

interface RitualSuccessStateProps {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function RitualSuccessState({
  eyebrow,
  title,
  body,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: RitualSuccessStateProps) {
  return (
    <section className="completion-panel section-card soft-panel rounded-[28px] border p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-3">
          <p className="section-kicker text-sm font-semibold uppercase">{eyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[#162117]">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[#526154] sm:text-base">
            {body}
          </p>
        </div>

        <div className="grid gap-3 rounded-[24px] border border-[#d8e1d3] bg-[linear-gradient(180deg,#f3f7ef_0%,#ffffff_100%)] p-4">
          <Link
            className="primary-button inline-flex items-center justify-center rounded-2xl bg-[#18201a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#243026]"
            href={primaryHref}
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              className="secondary-button inline-flex items-center justify-center rounded-2xl border border-[#d6ddd0] bg-white px-5 py-3 text-sm font-semibold text-[#263b29] hover:bg-[#f1f5ed]"
              href={secondaryHref}
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
