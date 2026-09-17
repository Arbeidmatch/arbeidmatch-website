import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { atsBaseUrl, fetchPublicJob } from "@/lib/jobs-fetch";

/**
 * Applying happens signed in, on the candidate portal.
 *
 * HIS DECISION, 17 September 2026: to apply for a job a candidate is signed in
 * and has a complete profile; nobody types their details into an application
 * form any more. So this address, which every advert's Apply button and every
 * shared link points at, sends the person to the job's Apply page in the
 * portal. There they sign in with a passkey, Google or a code by email (a new
 * address gets an account the same way), complete the profile once from their
 * CV, and apply with one press.
 *
 * The advert is still checked here first, so a closed job answers with this
 * site's own 404 rather than a trip to the portal and back.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function SoknadPage({ params }: Props) {
  const { slug } = await params;
  const job = await fetchPublicJob(slug);
  if (!job) notFound();
  redirect(`${atsBaseUrl()}/candidate/apply/${encodeURIComponent(slug)}`);
}
