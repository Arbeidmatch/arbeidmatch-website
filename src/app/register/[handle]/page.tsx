import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/jobs/ApplyForm";
import { atsBaseUrl } from "@/lib/jobs-fetch";

/**
 * Somebody joining, on the invitation of a person who has a name.
 *
 * HIS INSTRUCTION, 6 September 2026: the invitation link must be one the user
 * can personalise, it must say `register` rather than `apply`, and it must be on
 * arbeidmatch.no rather than on the ATS, because of what happens when it is
 * shared.
 *
 * All three are the same point. The old link was
 * `ats.arbeidmatch.no/apply/8f2c...`: a system address, on the subdomain we
 * deliberately keep out of the index, telling the reader nothing about who sent
 * it, and saying "apply" to somebody who is not applying to anything - they are
 * joining. This is `arbeidmatch.no/register/elena-iacob`: our own domain, a page
 * a search engine may read, and a name at the end of it.
 *
 * WHAT IT IS NOT is a second application pipeline. The ATS resolves the name to
 * the invitation token it already had, the form is the one every advert uses,
 * and it posts to /api/apply/<token> on this domain, which hands it on from the
 * server. The browser never speaks to the ATS. Consent, the duplicate check, the
 * file gate and the retention clock all stay in one place, where they were.
 *
 * The raw token still resolves here too, so a link shared before today lands on
 * this page rather than on nothing.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

type Invitation = { token: string; recruiter_name: string | null };

/** The invitation behind this name, or null when there is not one. */
async function resolveInvitation(handle: string): Promise<Invitation | null> {
  const clean = String(handle ?? "").trim();
  // A handle is short and plain, and a legacy token is a uuid. Anything else is
  // a typed URL and must not become a call upstream.
  if (!/^[A-Za-z0-9_-]{3,200}$/.test(clean)) return null;
  try {
    const res = await fetch(`${atsBaseUrl()}/api/public/register/${encodeURIComponent(clean)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: Invitation };
    const token = String(body.data?.token ?? "").trim();
    if (!/^[A-Za-z0-9_-]{16,200}$/.test(token)) return null;
    return { token, recruiter_name: (body.data?.recruiter_name ?? "").trim() || null };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const invitation = await resolveInvitation(handle);
  const who = invitation?.recruiter_name;
  // The root layout appends " | ArbeidMatch" to every title, so this must not
  // carry its own or the tab reads it twice - which it did, live, the minute
  // the page went up.
  const title = who ? `Register with ${who}` : "Register";
  const description = who
    ? `${who} at ArbeidMatch invites you to register. One form, a real person reading it, and work in Norway that matches what you have done.`
    : "Register with ArbeidMatch. One form, a real person reading it, and work in Norway that matches what you have done.";
  return {
    title,
    description,
    // INDEXED, UNLIKE THE APPLICATION FORM NEXT DOOR. An advert's form is a
    // second page for a job that already has one, so it is kept out. This is the
    // only page a recruiter's invitation has, and being shared is what it is
    // for.
    robots: { index: true, follow: true },
    alternates: { canonical: `/register/${encodeURIComponent(String(handle ?? "").trim().toLowerCase())}` },
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function RegisterPage({ params }: Props) {
  const { handle } = await params;
  const invitation = await resolveInvitation(handle);
  if (!invitation) notFound();

  const who = invitation.recruiter_name;

  return (
    /* The band and the sheet, as on the advert and its form. This page had the
       same fault they had: `text-navy` and `#555` written for a light page,
       landing on the site's own navy body, so the invitation somebody's name is
       on read as a blank screen with a form in the middle of it. */
    <main>
      <header className="bg-navy">
        <div className="mx-auto w-full max-w-content px-6 py-10 md:px-12 md:py-12 lg:px-20">
          <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Registration</p>
          <h1 className="am-h-advert mt-3 max-w-[820px] font-extrabold text-white">
            {who ? `${who} invited you to ArbeidMatch` : "Register with ArbeidMatch"}
          </h1>
          <p className="mt-4 max-w-prose text-white/70">
            Fill this in once. {who ? `${who.split(" ")[0]} reads it` : "A recruiter reads it"} and comes back to you by
            email, whichever way the answer goes. You are registering with us, not applying to one advert, so it counts
            for every job we are working on.
          </p>
        </div>
      </header>

      <div className="bg-white">
        <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20">
          <ApplyForm token={invitation.token} />

          <p className="mt-10 text-sm text-text-secondary">
            Looking for something specific?{" "}
            <Link href="/" className="font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
              See every open job
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
