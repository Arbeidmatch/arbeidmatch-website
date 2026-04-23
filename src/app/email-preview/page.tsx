import Link from "next/link";
import { notFound } from "next/navigation";

import { buildEmail, emailBodyParagraph, emailFieldRows } from "@/lib/emailTemplate";
import { emailParagraph, premiumCtaButton, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";

type PreviewItem = {
  key: string;
  title: string;
  subject: string;
  html: string;
};

function buildPreviews(): PreviewItem[] {
  const unsubscribeConfirmation = buildEmail({
    title: "You are unsubscribed",
    preheader: "Your email preferences were updated.",
    body:
      emailBodyParagraph("Hi Alex, you have been unsubscribed from ArbeidMatch marketing emails.") +
      emailFieldRows([
        { label: "Email", value: "alex.ionescu@example.com" },
        { label: "Effective", value: "Immediately" },
      ]),
  });

  const resubscribeConfirmation = buildEmail({
    title: "You are subscribed again",
    preheader: "Your subscription has been reactivated.",
    body:
      emailBodyParagraph("Welcome back, Alex. You will receive relevant ArbeidMatch updates again.") +
      emailFieldRows([
        { label: "Email", value: "alex.ionescu@example.com" },
        { label: "Status", value: "Subscribed" },
      ]),
  });

  const incompleteProfileReminderFirst = buildEmail({
    title: "Complete your profile to unlock applications",
    preheader: "Reminder 1 for incomplete candidate profile.",
    body:
      emailBodyParagraph("Hi Alex, your profile is currently 42% complete. Complete it to start applying.") +
      emailFieldRows([
        { label: "Candidate", value: "Alex Ionescu" },
        { label: "Profile score", value: "42%" },
      ]),
    ctaText: "Continue profile",
    ctaUrl: "https://arbeidmatch.no/candidates?email=alex.ionescu%40example.com",
  });

  const incompleteProfileReminderSecond = buildEmail({
    title: "Second reminder: complete your profile",
    preheader: "Reminder 2 for incomplete candidate profile.",
    body:
      emailBodyParagraph("Hi Alex, this is your second reminder. Your profile is still below 60%.") +
      emailFieldRows([
        { label: "Candidate", value: "Alex Ionescu" },
        { label: "Profile score", value: "42%" },
      ]),
    ctaText: "Complete profile now",
    ctaUrl: "https://arbeidmatch.no/candidates?email=alex.ionescu%40example.com",
  });

  const applyGateCandidateConfirmation = wrapPremiumEmail(
    [
      emailParagraph("Hi Alex,"),
      emailParagraph("Application received - Certified Electrician (Oslo)."),
      emailParagraph("Next step: we review your profile with the employer. If shortlisted, we contact you by email or phone."),
      `<div style="margin:20px 0;">${premiumCtaButton("https://jobs.arbeidmatch.no/jobs/certified-electrician-oslo", "View job details")}</div>`,
    ].join(""),
  );

  const applyGateInternalNotification = buildEmail({
    title: "New job application received",
    preheader: "Candidate applied through Apply Gate.",
    body:
      emailBodyParagraph("Alex Ionescu applied for Certified Electrician (Oslo).") +
      emailFieldRows([
        { label: "Candidate email", value: "alex.ionescu@example.com" },
        { label: "Phone", value: "+47 412 34 567" },
        { label: "Experience", value: "5-10 years" },
      ]),
    ctaText: "Open candidate profile in ATS",
    ctaUrl: "https://arbeidmatch.no/employer/candidates/app_123?token=mock-token",
  });

  const matchNotify = buildEmail({
    title: "New candidates available for your request",
    preheader: "Fresh matched candidates are now available.",
    body:
      emailBodyParagraph("We found 3 new candidates matching your request for Carpenter.") +
      emailFieldRows([
        { label: "Employer", value: "Nordic Build AS" },
        { label: "Category", value: "Carpenter" },
        { label: "Matches", value: "3 new candidates" },
      ]),
    ctaText: "View Candidates",
    ctaUrl: "https://arbeidmatch.no/contact",
  });

  const partnerRequest = wrapPremiumEmail(
    [
      emailParagraph("We received your ArbeidMatch partner request."),
      emailParagraph("Company: Baltic Recruiters OY. We will review details and contact you with next steps."),
    ].join(""),
  );

  const partnerOnboarding = buildEmail({
    title: "Partner onboarding started",
    preheader: "Your onboarding is in progress.",
    body:
      emailBodyParagraph("Hi Elena, your partner onboarding has started successfully.") +
      emailFieldRows([
        { label: "Partner", value: "Baltic Recruiters OY" },
        { label: "Onboarding owner", value: "ArbeidMatch Team" },
      ]),
    ctaText: "Open onboarding session",
    ctaUrl: "https://arbeidmatch.no/request/partner/mock-session-token",
  });

  const contactConfirmation = wrapPremiumEmail(
    [
      emailParagraph("Hello Maria,"),
      emailParagraph("We received your message regarding hiring welders in Trondheim."),
      emailParagraph("Our team will reply shortly on maria.popescu@example.com."),
    ].join(""),
  );

  const featureWaitlist = buildEmail({
    title: "You are on the waitlist",
    preheader: "Feature waitlist confirmation.",
    body:
      emailBodyParagraph("You have been added to the waitlist for ATS Candidate Auto-Shortlist.") +
      emailFieldRows([
        { label: "Email", value: "alex.ionescu@example.com" },
        { label: "Feature", value: "ATS Candidate Auto-Shortlist" },
      ]),
  });

  const nonEuLead = buildEmail({
    title: "Non-EU/EEA lead received",
    preheader: "Internal notification for non-EU lead.",
    body:
      emailBodyParagraph("A new non-EU lead submitted the guidance form.") +
      emailFieldRows([
        { label: "Name", value: "Ahmed Rahman" },
        { label: "Email", value: "ahmed.rahman@example.com" },
        { label: "Country", value: "Bangladesh" },
      ]),
  });

  const recruiterNetworkApply = buildEmail({
    title: "Recruiter network application received",
    preheader: "New recruiter network application.",
    body:
      emailBodyParagraph("A new recruiter applied for ArbeidMatch Recruiter Network.") +
      emailFieldRows([
        { label: "Recruiter", value: "Elena Ivanova" },
        { label: "Company", value: "Baltic Recruiters OY" },
        { label: "Email", value: "elena.ivanova@example.com" },
      ]),
    ctaText: "Review recruiter application",
    ctaUrl: "https://arbeidmatch.no/recruiter-network",
  });

  return [
    { key: "unsubscribe-confirmation", title: "Unsubscribe confirmare", subject: "You are unsubscribed from ArbeidMatch updates", html: unsubscribeConfirmation },
    { key: "resubscribe-confirmation", title: "Resubscribe confirmare", subject: "You are subscribed again", html: resubscribeConfirmation },
    { key: "profile-reminder-first", title: "Reminder profil incomplet (primul)", subject: "Complete your profile to unlock applications", html: incompleteProfileReminderFirst },
    { key: "profile-reminder-second", title: "Reminder profil incomplet (al doilea)", subject: "Second reminder: complete your profile", html: incompleteProfileReminderSecond },
    { key: "apply-gate-candidate-confirmation", title: "Apply Gate - confirmare aplicare candidat", subject: "Application received - Certified Electrician (Oslo)", html: applyGateCandidateConfirmation },
    { key: "apply-gate-internal-notification", title: "Apply Gate - notificare interna post@arbeidmatch.no", subject: "New candidate application - Certified Electrician (Oslo)", html: applyGateInternalNotification },
    { key: "match-notify-employer", title: "Match notify - angajator candidati noi disponibili", subject: "New candidates available for your request", html: matchNotify },
    { key: "partner-request-confirmation", title: "Partner request confirmare", subject: "We received your ArbeidMatch partner request", html: partnerRequest },
    { key: "partner-onboarding", title: "Partner onboarding", subject: "Partner onboarding started", html: partnerOnboarding },
    { key: "contact-form-confirmation", title: "Contact form confirmare", subject: "We received your message", html: contactConfirmation },
    { key: "feature-waitlist-confirmation", title: "Feature waitlist confirmare", subject: "You are on the waitlist", html: featureWaitlist },
    { key: "non-eu-lead", title: "Non-EU lead", subject: "New non-EU/EEA guidance lead", html: nonEuLead },
    { key: "recruiter-network-apply", title: "Recruiter network apply", subject: "Recruiter network application received", html: recruiterNetworkApply },
  ];
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EmailPreviewPage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const previews = buildPreviews();
  const params = searchParams ? await searchParams : {};
  const selectedRaw = params.email;
  const selectedKey = Array.isArray(selectedRaw) ? selectedRaw[0] : selectedRaw;
  const active = previews.find((item) => item.key === selectedKey) || previews[0];

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-4 py-8 text-white md:px-8">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <h1 className="text-3xl font-bold">Email Preview</h1>
        <p className="text-sm text-white/70">Development-only previews for all email templates with realistic mock data.</p>

        <div className="rounded-xl border border-white/15 bg-white/5 p-3">
          <div className="flex flex-wrap gap-2">
            {previews.map((item) => {
              const isActive = item.key === active.key;
              return (
                <Link
                  key={item.key}
                  href={`/email-preview?email=${encodeURIComponent(item.key)}`}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]"
                      : "border-white/20 bg-white/5 text-white/75 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>

        <section className="rounded-xl border border-white/15 bg-white/5 p-4">
          <h2 className="text-lg font-semibold text-[#C9A84C]">{active.title}</h2>
          <p className="mt-1 text-sm text-white/80">
            <span className="text-white/60">Subject:</span> {active.subject}
          </p>
          <iframe
            title={active.title}
            srcDoc={active.html}
            className="mt-4 h-[680px] w-full rounded-lg border border-white/15 bg-white"
            sandbox=""
          />
        </section>
      </div>
    </main>
  );
}
