import Link from "next/link";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

type Props = {
  kind: "invalid" | "wrong_guide" | "expired";
  guideSlug: DsbGuideSlug;
};

export default function DsbAccessDenied({ kind, guideSlug }: Props) {
  const title =
    kind === "expired"
      ? "This access link has expired"
      : kind === "wrong_guide"
        ? "This link is not valid for this guide"
        : "We could not verify access";

  const detail =
    kind === "expired"
      ? "Your 30-day access period has ended. Purchase again to continue."
      : "Purchase required to access this guide, or your link may be invalid.";

  return (
    <section className="min-h-[60vh] bg-surface py-16">
      <div className="mx-auto w-full max-w-lg px-4 text-center md:px-6">
        <div className="rounded-xl border border-border bg-white p-8 shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-3 text-sm text-text-secondary">{detail}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dsb-support"
              className="inline-flex justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-white hover:bg-gold-hover"
            >
              Get access
            </Link>
            <Link
              href={`/dsb-support#guide-${guideSlug}`}
              className="inline-flex justify-center rounded-md border border-navy px-5 py-2.5 text-sm font-medium text-navy hover:bg-surface"
            >
              View pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
