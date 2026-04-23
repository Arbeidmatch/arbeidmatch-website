"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  token: string;
};

export default function DsbGuidePending({ token }: Props) {
  const router = useRouter();
  const attempts = useRef(0);

  useEffect(() => {
    const id = window.setInterval(async () => {
      attempts.current += 1;
      if (attempts.current > 45) {
        window.clearInterval(id);
        return;
      }
      try {
        const res = await fetch(`/api/dsb-guide/access-status?token=${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { status?: string | null };
        if (data.status === "paid") {
          router.refresh();
        }
      } catch {
        // ignore
      }
    }, 2000);

    return () => window.clearInterval(id);
  }, [token, router]);

  return (
    <section className="min-h-[50vh] bg-surface py-16">
      <div className="mx-auto w-full max-w-lg px-4 text-center md:px-6">
        <div className="rounded-xl border border-border bg-white p-8 shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
          <p className="text-lg font-semibold text-navy">This access flow is disabled.</p>
          <p className="mt-2 text-sm text-text-secondary">
            Paid DSB guide access is no longer active. Use the free information page for current guidance.
          </p>
          <div className="mt-6 flex justify-center">
            <span
              className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}
