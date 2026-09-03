import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyForm } from "@/components/jobs/ApplyForm";
import { atsBaseUrl, fetchPublicJob } from "@/lib/jobs-fetch";

/**
 * Applying, without leaving this site.
 *
 * HIS INSTRUCTION, 3 September 2026: "omul aplica pe website si procesata
 * aplicatia in ats si tot procesul." Until now the button on an advert sent the
 * person to jobs.arbeidmatch.no, so the application arrived in RecMan and the
 * ATS learned about it second-hand. RecMan stays for staffing and for the
 * contracts already in it; new applications come to us.
 *
 * THE SESSION IS MINTED HERE, ON THE SERVER. The ATS answers `/api/public/jobs/
 * <slug>/apply` with a one-job token, and it checks the things that decide
 * whether an advert can be applied to at all: the job is open, the slug is the
 * canonical one, and there is an active recruiter to receive it. Doing that
 * before the form is drawn means a closed advert says so instead of taking
 * somebody through a form and refusing them at the end.
 *
 * The token never reaches the ATS from the browser. The form posts to
 * `/api/apply/<token>` on this domain, and our server hands it on.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await fetchPublicJob(slug, 300);
  const title = job ? `Apply: ${job.title} | ArbeidMatch` : "Apply | ArbeidMatch";
  return {
    title,
    // A form is not a page anybody should arrive at from a search result; the
    // advert is. This keeps one page per job in the index rather than two.
    robots: { index: false, follow: true },
  };
}

/** The one-job token, or null when this advert cannot be applied to. */
async function mintApplyToken(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${atsBaseUrl()}/api/public/jobs/${encodeURIComponent(slug)}/apply`, {
      method: "POST",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { redirect?: string };
    // The ATS answers with the path its own form would use: /apply/<token>.
    const token = String(body.redirect ?? "").split("/").filter(Boolean).pop() ?? "";
    return /^[A-Za-z0-9_-]{16,200}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}

export default async function SoknadPage({ params }: Props) {
  const { slug } = await params;
  const job = await fetchPublicJob(slug, 300);
  if (!job) notFound();

  const token = await mintApplyToken(slug);

  return (
    <main className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20">
      <nav aria-label="Breadcrumb" className="text-sm text-text-secondary">
        <Link href="/" className="hover:text-gold">
          Open jobs
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <Link href={`/stilling/${encodeURIComponent(slug)}`} className="hover:text-gold">
          {job.title}
        </Link>
        <span aria-hidden className="mx-2">
          /
        </span>
        <span className="text-navy">Apply</span>
      </nav>

      <p className="am-eyebrow mt-6 font-semibold uppercase tracking-[0.14em] text-gold">Application</p>
      <h1 className="am-h1 mt-3 max-w-[820px] font-extrabold leading-tight tracking-tight text-navy">{job.title}</h1>
      <p className="mt-4 max-w-prose text-text-secondary">
        {(job.location ?? "").trim() ? `${job.location}. ` : ""}A recruiter reads every application. We answer by
        email, whichever way the answer goes.
      </p>

      <div className="mt-10">
        {token ? (
          <ApplyForm token={token} jobTitle={job.title} />
        ) : (
          /* An advert that closed between the list being drawn and this page
             being opened, or a recruiter who is no longer active. Saying so is
             better than a form that cannot be sent. */
          <div className="rounded-2xl border border-border p-8">
            <h2 className="text-xl font-bold text-navy">This position is not taking applications.</h2>
            <p className="mt-3 max-w-prose text-text-secondary">
              It may have just closed.{" "}
              <Link href="/" className="font-semibold text-gold hover:underline">
                See every open job
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
