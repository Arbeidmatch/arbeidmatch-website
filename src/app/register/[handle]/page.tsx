import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
 * WHAT IT IS NOT is a form. HIS DECISION, 17 September 2026: candidates do not
 * type their details into a form any more; they sign in and fill a profile once.
 * The ATS resolves the name to the invitation token it already had, and the
 * button here opens the candidate sign-in with that token, so the account and
 * profile created there belong to the person who sent the invitation. Consent,
 * the duplicate check, the file gate and the retention clock stay in the ATS.
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
  // HIS WORDS, 5 October 2026: "in loc de register cu Mirel Manoliu sa fie
  // register in ArbeidMatch si mai mic invitatie trimisa de ...". The title is
  // the company's, whoever sent the link; the sender is named in the line under it.
  const title = "Register in ArbeidMatch";
  const description = who
    ? `Invitation from ${who}. Sign in with your email, upload your CV, and a real person reads your profile for work in Norway.`
    : "Register in ArbeidMatch. Sign in with your email, upload your CV, and a real person reads your profile for work in Norway.";
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
  const initials = who
    ? who
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .filter((_, i, all) => i === 0 || i === all.length - 1)
        .join("")
    : "";
  const steps = [
    { title: "Sign in with your email", text: "No password: we send you a code, or you use Google." },
    { title: "Upload your CV", text: "We fill in most of your profile from it, and you add what is missing." },
    { title: "Apply with one press", text: "To any of our jobs, whenever you want." },
  ];

  return (
    /* The band and the sheet, as on the advert and its form. This page had the
       same fault they had: `text-navy` and `#555` written for a light page,
       landing on the site's own navy body, so the invitation somebody's name is
       on read as a blank screen with a form in the middle of it. */
    <main>
      <header className="bg-navy">
        <div className="mx-auto w-full max-w-content px-5 py-8 md:px-12 md:py-14 lg:px-20">
          <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Registration</p>
          <h1 className="am-h-advert mt-3 max-w-[820px] font-extrabold text-white">Register in ArbeidMatch</h1>
          {/* The sender, smaller than the title: every user's link shows their own name, and no name shows no line. */}
          {who ? (
            <p className="mt-3 flex items-center gap-2.5 text-[15px] text-white/85 md:text-base">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-gold md:h-8 md:w-8 md:text-xs"
              >
                {initials}
              </span>
              <span>
                Invitation from <span className="font-bold text-white">{who}</span>
              </span>
            </p>
          ) : null}
          <p className="mt-4 max-w-prose text-white/70">
            Sign up once. {who ? `${who.split(" ")[0]} reads your profile` : "A recruiter reads your profile"} and comes back to
            you by email, whichever way the answer goes.
            <span className="hidden md:inline">
              {" "}
              You are registering with us, not applying to one advert, so it counts for every job we are working on.
            </span>
          </p>
        </div>
      </header>

      <div className="bg-white">
        <div className="mx-auto w-full max-w-content px-5 py-8 md:px-12 md:py-14 lg:px-20">
          {/* Three cards side by side on a wide screen, a numbered list on a phone. */}
          <ol className="flex max-w-[980px] flex-col gap-3 md:grid md:grid-cols-3 md:gap-5">
            {steps.map((step, i) => (
              <li key={step.title} className="flex items-start gap-3 md:flex-col md:gap-2 md:rounded-2xl md:border md:border-border md:p-5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[13px] font-extrabold text-[#9C7A2E] md:h-auto md:w-auto md:bg-transparent">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-relaxed text-navy">
                  <span className="font-bold md:block md:text-base">{step.title}.</span>{" "}
                  <span className="text-text-secondary md:mt-1 md:block md:text-sm">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-6">
            <a
              href={`${atsBaseUrl()}/candidate/login?invite=${encodeURIComponent(invitation.token)}`}
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-navy px-7 py-3 text-base font-semibold text-white transition hover:bg-navy/90"
            >
              Create my profile
            </a>
            <p className="text-center text-sm text-text-secondary md:text-left">
              <span className="hidden md:inline">Looking for something specific? </span>
              <Link href="/" className="inline-flex min-h-[44px] items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">
                See every open job
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
