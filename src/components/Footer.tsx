import Link from "next/link";

function FooterColumnTitle({ children }: { children: string }) {
  return <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.55)]">{children}</p>;
}

function FooterNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-3 block text-sm text-[rgba(255,255,255,0.5)] transition-colors hover:text-[rgba(255,255,255,0.85)]"
    >
      {label}
    </Link>
  );
}

function FooterExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-3 block text-sm text-[rgba(255,255,255,0.5)] transition-colors hover:text-[rgba(255,255,255,0.85)]"
    >
      {label}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] text-[rgba(255,255,255,0.5)]">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-14 lg:px-20 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block text-[1.3rem] font-bold leading-none text-[#C9A84C]">
              ArbeidMatch
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[rgba(255,255,255,0.5)]">Influence. Source. Earn.</p>
            <p className="mt-6 text-xs leading-relaxed text-[rgba(255,255,255,0.5)]">
              © 2026 ArbeidMatch Norge AS. Org.nr: 935 667 089 MVA
            </p>
          </div>

          <div>
            <FooterColumnTitle>For Employers</FooterColumnTitle>
            <FooterNavLink href="/request" label="Request Candidates" />
            <FooterNavLink href="/#how-it-works" label="How it works" />
            <FooterNavLink href="/contact" label="Contact" />
          </div>

          <div>
            <FooterColumnTitle>For Candidates</FooterColumnTitle>
            <FooterNavLink href="/for-candidates#join-talent" label="Join talent network" />
            <FooterNavLink href="/for-candidates" label="For candidates" />
            <FooterExternalLink href="https://jobs.arbeidmatch.no" label="Apply" />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <FooterColumnTitle>Legal</FooterColumnTitle>
            <FooterNavLink href="/privacy" label="Privacy Policy" />
            <FooterNavLink href="/terms" label="Terms of Service" />
            <FooterNavLink href="/dpa" label="Data Processing Agreement" />
            <FooterNavLink href="/legal-request" label="Legal Request" />
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto w-full max-w-content px-6 py-4 text-center text-xs leading-relaxed text-[rgba(255,255,255,0.5)] md:px-12 lg:px-20">
          Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway · post@arbeidmatch.no · arbeidmatch.no
        </div>
      </div>
    </footer>
  );
}
