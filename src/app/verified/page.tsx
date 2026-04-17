import Link from "next/link";

export default function VerifiedPage() {
  return (
    <section className="bg-surface py-12">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="rounded-xl border border-border bg-white p-8 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl font-bold text-white">
            ✓
          </div>
          <h1 className="mt-4 text-3xl font-bold text-navy">Your email has been verified!</h1>
          <p className="mt-3 text-text-secondary">
            You&apos;re now registered for notifications. We&apos;ll be in touch when opportunities
            match your profile.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-md bg-[#0D1B2A] px-6 py-3 text-sm font-medium text-white hover:bg-[#122845]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
