import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, ClipboardCheck, FileText, LogIn } from "lucide-react";
import { CANDIDATE_PORTAL_LOGIN_URL } from "@/lib/candidatePortal";

export const metadata: Metadata = {
  title: "Employee portal | ArbeidMatch",
  description: "Sign in to the ArbeidMatch employee portal to manage your profile, applications, and work information.",
};

const portalFeatures = [
  { title: "Your profile", text: "Keep your skills, experience, and contact details up to date.", Icon: FileText },
  { title: "Applications", text: "See the jobs you have applied for and follow their progress.", Icon: ClipboardCheck },
  { title: "Work opportunities", text: "Browse current roles in Norway and apply when a role fits you.", Icon: BriefcaseBusiness },
] as const;

export default function EmployeesPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#0D1B2A] px-6 py-14 text-white md:py-20 lg:px-20 lg:py-24">
      <div className="mx-auto max-w-content">
        <section className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C]">ArbeidMatch employee portal</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.03em] text-white md:text-5xl">
            Sign in to your employee portal
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            Access your candidate profile, job applications, and the information you need for your work journey in Norway.
          </p>
          <a
            href={CANDIDATE_PORTAL_LOGIN_URL}
            className="mt-8 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-8 py-3.5 text-base font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          >
            <LogIn className="h-5 w-5" aria-hidden />
            Sign in
          </a>
          <p className="mt-4 text-sm text-white/55">
            New to ArbeidMatch?{" "}
            <Link href="/for-candidates" className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline">
              Create your profile
            </Link>
          </p>
        </section>

        <section className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-3" aria-label="Employee portal features">
          {portalFeatures.map(({ title, text, Icon }) => (
            <article key={title} className="rounded-2xl border border-white/[0.1] bg-white/[0.04] p-6">
              <Icon className="text-[#C9A84C]" size={26} strokeWidth={1.6} aria-hidden />
              <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
