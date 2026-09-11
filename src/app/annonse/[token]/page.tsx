import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OrderClient from "@/components/job-ads/OrderClient";
import { pageShellClass } from "@/components/job-ads/ui";
import { isOrderToken } from "@/lib/job-ads/types";

/** A client's own order: reachable only by its long token, never indexed. */
export const metadata: Metadata = {
  title: "Stillingsannonse | ArbeidMatch",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdvertOrderPage({ params, searchParams }: Props) {
  const { token } = await params;
  if (!isOrderToken(token)) notFound();
  const sp = await searchParams;
  const raw = Array.isArray(sp.session_id) ? sp.session_id[0] : sp.session_id;
  const sessionId = typeof raw === "string" && /^cs_[A-Za-z0-9_]{8,250}$/.test(raw) ? raw : null;
  return (
    <div className={pageShellClass}>
      <OrderClient token={token} sessionId={sessionId} />
    </div>
  );
}
