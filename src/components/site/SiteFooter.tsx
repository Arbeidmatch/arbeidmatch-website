"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { betaCopy } from "@/components/BetaBanner";
import { ProtectedEmail } from "@/components/ProtectedEmail";
import { SupportButton } from "@/components/support/SupportRequest";
import { SITE_PATHS, STAFFING_REGISTER_URL, hidesFooter, siteLang } from "@/components/site/siteNav";
import { useSiteNumbers } from "@/components/NumbersProvider";
import { text } from "@/lib/numbers";

/**
 * The footer of every public page (ORDER 295): the same five columns
 * everywhere, in the page's language, the beta line inside it, and support
 * instead of a mailbox for questions. The imprint keeps the one address and
 * the owner link it has carried since 25 September 2026 (ehandelsloven § 8).
 */
export default function SiteFooter() {
  const pathname = usePathname() ?? "/";
  // ORDER 302: the org number and the street are RecOS's; a missing one leaves its piece of the line out.
  const siteNumbers = useSiteNumbers();
  const orgNumber = text(siteNumbers, "company_org_number");
  const street = text(siteNumbers, "company_street_address");
  if (hidesFooter(pathname)) return null;
  const no = siteLang(pathname) === "no";
  const beta = betaCopy(no);

  return (
    <div className="ams">
      <footer className="s-f">
        <div className="w">
          <div className="s-fg">
            <div>
              <Link href={SITE_PATHS.home} className="logo">
                ArbeidMatch
              </Link>
              <p style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0 6px" }}>
                <span>{no ? "Kundestøtte:" : "Customer support:"}</span>
                <SupportButton lang={no ? "nb" : "en"} showIcon={false} className="flink">
                  {no ? "Kontakt support" : "Contact support"}
                </SupportButton>
              </p>
            </div>
            <div>
              <h4>For bedrifter</h4>
              <ul>
                <li><Link href={SITE_PATHS.firms}>Slik jobber vi</Link></li>
                <li><Link href={SITE_PATHS.forsprang}>Forsprang</Link></li>
                <li><Link href={SITE_PATHS.request} data-rask-foresporsel="">Be om kandidater</Link></li>
              </ul>
            </div>
            <div>
              <h4>For candidates</h4>
              <ul>
                <li><Link href={SITE_PATHS.candidates}>How it works</Link></li>
                <li><Link href={SITE_PATHS.jobs}>Open jobs</Link></li>
                <li><Link href={SITE_PATHS.lifeInNorway}>Life in Norway</Link></li>
                <li><Link href={SITE_PATHS.support}>Support</Link></li>
              </ul>
            </div>
            <div>
              <h4>{no ? "Selskapet" : "Company"}</h4>
              <ul>
                <li><Link href={SITE_PATHS.about}>{no ? "Om oss" : "About"}</Link></li>
                <li><Link href={SITE_PATHS.network}>Recruiter network</Link></li>
                <li><Link href={SITE_PATHS.contact}>{no ? "Kontakt" : "Contact"}</Link></li>
              </ul>
            </div>
            <div>
              <h4>{no ? "Vilkår og personvern" : "Terms and privacy"}</h4>
              <ul>
                <li><Link href={SITE_PATHS.privacy}>{no ? "Personvern" : "Privacy"}</Link></li>
                <li><Link href={SITE_PATHS.terms}>{no ? "Vilkår" : "Terms"}</Link></li>
                <li><button type="button" data-sheet="cookies">{no ? "Informasjonskapsler" : "Cookies"}</button></li>
                <li><Link href={no ? SITE_PATHS.legal : `${SITE_PATHS.legal}?lang=en`}>{no ? "Alle retningslinjer" : "All policies"}</Link></li>
              </ul>
            </div>
          </div>
          <div className="beta">
            <i>BETA</i>
            <span>{beta.heading}</span>
            <span>
              <Link href={SITE_PATHS.feedback}>{beta.feedback}</Link>
            </span>
          </div>
          {/* The beta notice's terms, folded: they used to be a band of their own above the footer. */}
          <details className="beta-more" open={pathname === "/terms" || pathname === "/privacy" || undefined}>
            <summary>{beta.details}</summary>
            <p>{beta.intro}</p>
            <p>{beta.operation}</p>
            <p>{beta.results}</p>
            <p>{beta.rights}</p>
          </details>
          <div className="legal">
            © 2026 ArbeidMatch Norge AS · {orgNumber ? `Org.nr ${orgNumber} MVA · ` : ""}{street ? `${street}, 7056 Ranheim · ` : ""}
            <ProtectedEmail username="post" domain="arbeidmatch.no" className="" loadingLabel="" /> ·{" "}
            {/* ORDER 424: the claim opens its proof, Arbeidstilsynet's register searched for our org number. */}
            <a href={STAFFING_REGISTER_URL} target="_blank" rel="noopener noreferrer">
              {no ? "Godkjent bemanningsforetak, registrert hos Arbeidstilsynet." : "Approved staffing agency, registered with Arbeidstilsynet."}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
