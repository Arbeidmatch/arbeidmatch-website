"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { trackAlertLinkClicked } from "@/lib/analytics/roleAlertEvents";

export default function PartnerSearchClient() {
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") || "").trim();
  const alertId = (searchParams.get("alert_id") || "").trim();

  useEffect(() => {
    if (!role || !alertId) return;
    trackAlertLinkClicked(role, alertId);
  }, [alertId, role]);

  const requestHref = role ? `/request?role=${encodeURIComponent(role)}` : "/request";

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-6 py-14 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">Role Alert Notification</p>
        <h1 className="mt-3 text-3xl font-bold">New candidates are ready</h1>
        <p className="mt-3 text-sm text-white/70">
          {role ? `We found new matches for ${role}.` : "We found new candidate matches based on your alert."}
        </p>
        <Link
          href={requestHref}
          className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-xl bg-[#C9A84C] px-6 py-3 text-sm font-bold text-[#0D1B2A]"
        >
          View Candidates
        </Link>
      </div>
    </main>
  );
}

