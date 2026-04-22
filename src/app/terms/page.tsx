import type { Metadata } from "next";
import Link from "next/link";

import LegalDocShell, { LegalSection } from "@/components/legal/LegalDocShell";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

const SUPPORT = "support@arbeidmatch.no";

export const metadata: Metadata = {
  ...nbPageMetadata(
    "/terms",
    "Terms of Service | ArbeidMatch",
    "Terms and conditions for using ArbeidMatch websites and services. User responsibilities and limitations of liability.",
  ),
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalDocShell
      label="Legal"
      title="Terms of Service"
      intro={
        <>
          <p>
            These Terms of Service (“Terms”) govern your access to and use of <strong className="text-white/90">arbeidmatch.no</strong>{" "}
            and related services operated by <strong className="text-white/90">ArbeidMatch Norge AS</strong> (“ArbeidMatch”, “we”, “us”).
            By using the site you agree to these Terms.
          </p>
          <p className="mt-4 text-[14px] text-white/55">
            Org. nr. 935 667 089 (MVA) · Sverre Svendsens veg 38, 7056 Ranheim, Norway · post@arbeidmatch.no
            <br />
            <span className="text-white/45">Last updated: April 2026</span>
          </p>
        </>
      }
    >
      <LegalSection title="1. Acceptance and eligibility">
        <p>
          If you do not agree to these Terms, you must not use the website or submit personal data through our forms. You
          confirm that you are at least 16 years old (or the age of digital consent in your country) and, where you act
          on behalf of a company, that you are authorised to bind that organisation.
        </p>
      </LegalSection>

      <LegalSection title="2. Conditions of use">
        <p>You agree to use ArbeidMatch only for lawful purposes and in accordance with these Terms. In particular, you must not:</p>
        <ul>
          <li>Violate applicable law in Norway, the EEA or your country of residence;</li>
          <li>Attempt to gain unauthorised access to our systems, other users&apos; accounts, or data;</li>
          <li>Use the site to distribute malware, scrape or overload infrastructure beyond normal personal use, or bypass
            security or rate limits;</li>
          <li>Misrepresent your identity, qualifications, company or authority;</li>
          <li>Upload unlawful, defamatory, discriminatory or infringing content;</li>
          <li>Use outputs from our services (including guides) to provide competing automated scraping or resale services
            without permission.</li>
        </ul>
        <p>We may suspend or refuse access where we reasonably believe a breach has occurred.</p>
      </LegalSection>

      <LegalSection title="3. Our services">
        <p>ArbeidMatch provides recruitment-related services, information resources, and digital products as described on the site. Unless expressly agreed in a separate written contract, nothing on the site constitutes a binding offer of employment, placement or a specific outcome.</p>
        <ul>
          <li><strong>Recruitment and matching:</strong> subject to separate terms or statements where we confirm engagement.</li>
          <li><strong>Digital guides and paid content:</strong> licensed for personal use as stated at purchase.</li>
          <li><strong>Free content and forms:</strong> provided “as is” for general information; not legal advice.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. User responsibilities">
        <p>You are responsible for:</p>
        <ul>
          <li>
            <strong>Accuracy of information:</strong> ensuring that all data you submit (including CVs, company details and
            job requirements) is truthful, up to date and not misleading;
          </li>
          <li>
            <strong>Compliance with employment and immigration law:</strong> employers remain responsible for hiring
            decisions, work permits, tax, social security and collective agreements; candidates remain responsible for the
            accuracy of their credentials and right-to-work representations;
          </li>
          <li>
            <strong>Credentials and devices:</strong> keeping passwords and access links confidential and notifying us if
            you suspect misuse;
          </li>
          <li>
            <strong>Content you upload:</strong> ensuring you have the right to share documents and that they do not
            infringe third-party rights;
          </li>
          <li>
            <strong>Professional advice:</strong> obtaining independent legal, tax or immigration advice where your situation
            requires it.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Digital guide purchases">
        <p>
          Upon purchase you receive a personal, non-transferable licence to access the purchased guide for the period
          stated at checkout. Licences are for your personal or internal business use only, as specified on the product
          page.
        </p>
        <p>
          You may not copy, share, reproduce, resell, publicly display or create derivative works from paid content except
          as allowed by mandatory law. Digital content may be delivered immediately; statutory rights of withdrawal may be
          limited once you access the content, as disclosed at purchase in line with applicable consumer rules.
        </p>
        <p>
          Guides summarise public information and our experience; they do not guarantee outcomes with public authorities
          (e.g. DSB) or employers. Always verify requirements with the relevant authority.
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual property">
        <p>
          All content on arbeidmatch.no (text, graphics, logos, layout, software) is owned by ArbeidMatch or its licensors
          and is protected by copyright and other intellectual property laws. No licence is granted except as expressly
          stated in these Terms or in writing.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of liability">
        <p>To the fullest extent permitted by applicable law:</p>
        <ul>
          <li>
            The site and services are provided <strong>“as is”</strong> and <strong>“as available”</strong>. We disclaim
            warranties not mandatory under law, including implied warranties of merchantability, fitness for a particular
            purpose and non-infringement.
          </li>
          <li>
            We are <strong>not liable</strong> for indirect or consequential loss, including lost profits, lost data,
            business interruption or reputational harm, except where such exclusion is void under mandatory Norwegian or
            EEA consumer law.
          </li>
          <li>
            We are <strong>not liable</strong> for outcomes of applications to authorities, visa or work permit decisions,
            employer hiring decisions, or third-party conduct.
          </li>
          <li>
            Our aggregate liability arising from these Terms or your use of the site (other than for death, personal injury
            caused by negligence, fraud, or other liability that cannot be limited by law) is limited to the greater of
            (a) the amount you paid us for the specific service giving rise to the claim in the twelve (12) months before
            the event, or (b) NOK 5,000, except where a different mandatory limit applies to consumers.
          </li>
        </ul>
        <p>Some jurisdictions do not allow certain limitations; in that case our liability is limited to the maximum permitted by law.</p>
      </LegalSection>

      <LegalSection title="8. Indemnity">
        <p>
          You agree to indemnify and hold harmless ArbeidMatch and its officers, employees and affiliates from claims,
          damages, losses and expenses (including reasonable legal fees) arising from your breach of these Terms, your
          content, or your misuse of the services, except to the extent caused by our gross negligence or wilful misconduct.
        </p>
      </LegalSection>

      <LegalSection title="9. Links and third parties">
        <p>
          The site may link to third-party websites or tools. We are not responsible for their content or privacy
          practices. Your use of third-party services is at your own risk and subject to their terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing law and disputes">
        <p>
          These Terms are governed by the laws of <strong>Norway</strong>, without regard to conflict-of-law rules that
          would apply another law. Courts in Norway have exclusive jurisdiction for disputes arising from these Terms,
          subject to mandatory rights you may have as a consumer in your country of residence.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes">
        <p>
          We may update these Terms. The “Last updated” date will change. Continued use after changes constitutes
          acceptance, except where prior consent is required by law for material changes affecting consumers.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          ArbeidMatch Norge AS
          <br />
          Service and legal notices:{" "}
          <a className="font-medium text-[#C9A84C] underline-offset-4 hover:underline" href={`mailto:${SUPPORT}`}>
            {SUPPORT}
          </a>
          <br />
          General: post@arbeidmatch.no · +47 96 73 47 30 · arbeidmatch.no
        </p>
        <p className="pt-4 text-[14px] text-white/50">
          Related:{" "}
          <Link className="text-[#C9A84C]/90 underline-offset-4 hover:underline" href="/privacy">
            Privacy Policy
          </Link>
        </p>
      </LegalSection>
    </LegalDocShell>
  );
}
