import type { Metadata } from "next";
import Link from "next/link";

import LegalDocShell, { LegalSection } from "@/components/legal/LegalDocShell";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

const SUPPORT = "support@arbeidmatch.no";

export const metadata: Metadata = {
  ...nbPageMetadata(
    "/privacy",
    "Privacy Policy | ArbeidMatch",
    "How ArbeidMatch collects, uses and protects personal data. GDPR-aligned information for candidates, employers and visitors.",
  ),
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalDocShell
      label="Privacy"
      title="Privacy Policy"
      intro={
        <>
          <p>
            <strong className="text-white/90">ArbeidMatch Norge AS</strong> (“we”, “us”) is the data controller for personal
            data processed through arbeidmatch.no and related services, unless stated otherwise.
          </p>
          <p className="mt-4 text-[14px] text-white/55">
            Org. nr. 935 667 089 (MVA) · Sverre Svendsens veg 38, 7056 Ranheim, Norway · post@arbeidmatch.no
            <br />
            <span className="text-white/45">Last updated: April 2026</span>
          </p>
        </>
      }
    >
      <LegalSection title="1. Scope">
        <p>
          This policy describes how we process personal data when you use our website, register as a candidate, submit
          employer or partner requests, purchase digital products, subscribe to updates, or contact us.
        </p>
      </LegalSection>

      <LegalSection title="2. What data we collect">
        <p>Depending on how you interact with us, we may process categories such as:</p>
        <ul>
          <li>
            <strong>Identity and contact:</strong> name, email address, telephone number, country of residence, company
            name and role.
          </li>
          <li>
            <strong>Recruitment and workforce data:</strong> CV or profile details, work history, skills, languages,
            availability, application answers and documents you upload (e.g. certificates).
          </li>
          <li>
            <strong>Transaction and account data:</strong> order references, access tokens for digital content, billing
            contact details. We do <strong>not</strong> store full payment card numbers; card data is handled by our
            payment processor.
          </li>
          <li>
            <strong>Technical and security data:</strong> IP address, browser type, device identifiers, timestamps and
            logs needed to secure the service and prevent abuse.
          </li>
          <li>
            <strong>Communications:</strong> messages you send via forms, email or chat integrations, and records of
            consent or marketing preferences where applicable.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use your data">
        <p>We use personal data only where we have a valid legal basis under the GDPR, including:</p>
        <ul>
          <li>
            <strong>To provide our services</strong> (contract, Art. 6(1)(b)): processing applications, matching
            profiles, fulfilling employer requests, delivering purchased guides and managing access.
          </li>
          <li>
            <strong>With your consent</strong> (Art. 6(1)(a)): optional marketing, non-essential cookies where enabled, and
            certain waitlists or newsletters you opt into. You may withdraw consent at any time.
          </li>
          <li>
            <strong>Legitimate interests</strong> (Art. 6(1)(f)): improving the website, analytics compatible with your
            choices, fraud prevention, IT security, and internal reporting, where not overridden by your rights.
          </li>
          <li>
            <strong>Legal obligations</strong> (Art. 6(1)(c)): bookkeeping, tax and regulatory requirements where
            applicable.
          </li>
        </ul>
        <p>
          We do not sell your personal data. We do not use automated decision-making that produces legal or similarly
          significant effects solely by automated means without human review, unless we expressly inform you and provide
          a lawful basis.
        </p>
      </LegalSection>

      <LegalSection title="4. Storage and location">
        <p>
          Personal data is stored in secure environments. Primary hosting and databases for the services described on
          this site are located in the <strong>European Economic Area (EEA)</strong>. Backups and redundancy measures
          remain within the same compliance framework agreed with our infrastructure providers.
        </p>
        <p>
          If a strictly necessary sub-processor processes data outside the EEA, we rely on appropriate safeguards such as
          the EU Standard Contractual Clauses and supplementary measures where required.
        </p>
      </LegalSection>

      <LegalSection title="5. External providers (categories)">
        <p>
          We use a limited set of processors to run the platform. They only receive the data required for their
          function and are bound by written agreements and GDPR obligations. Categories include (without naming
          individual vendors in this public summary):
        </p>
        <ul>
          <li>
            <strong>Managed database and authentication</strong>: hosting of application data and user sessions in the
            EEA.
          </li>
          <li>
            <strong>Payment services</strong>: card payments and fraud checks; card data is processed only on the
            processor&apos;s side.
          </li>
          <li>
            <strong>Email and transactional messaging</strong>: delivery of confirmations, password resets and
            service-related notices.
          </li>
          <li>
            <strong>File storage</strong>: storage of documents you upload (e.g. CVs) under access controls.
          </li>
          <li>
            <strong>Infrastructure and logging</strong>: application hosting, CDN and security monitoring compatible with
            GDPR.
          </li>
        </ul>
        <p>
          A current list of processor categories is available on request. Commercial agreements may name specific
          vendors confidentially where needed.
        </p>
      </LegalSection>

      <LegalSection title="6. Retention">
        <p>
          We keep data only as long as necessary for the purposes above, including legal, tax and accounting requirements.
          Typical ranges: active recruitment profiles until withdrawal or inactivity periods stated in product flows;
          employer request records for the duration of the relationship plus a limited statutory period; financial
          records as required by Norwegian law. Specific retention may vary by product and will be communicated where
          relevant.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights (GDPR)">
        <p>You may exercise the following rights in respect of your personal data:</p>
        <ul>
          <li>Right of <strong>access</strong> (Art. 15)</li>
          <li>Right to <strong>rectification</strong> (Art. 16)</li>
          <li>Right to <strong>erasure</strong> (“right to be forgotten”) (Art. 17), subject to legal exceptions</li>
          <li>Right to <strong>restriction</strong> of processing (Art. 18)</li>
          <li>Right to <strong>data portability</strong> (Art. 20), where processing is based on consent or contract and is
            automated</li>
          <li>Right to <strong>object</strong> to processing based on legitimate interests (Art. 21)</li>
          <li>Right to <strong>withdraw consent</strong> at any time, without affecting the lawfulness of processing
            before withdrawal</li>
          <li>Right to lodge a complaint with a supervisory authority (in Norway: Datatilsynet)</li>
        </ul>
        <p>
          To request access, deletion, export of your data in a structured machine-readable format where applicable, or
          to exercise any other right, contact{" "}
          <a className="font-medium text-[#C9A84C] underline-offset-4 hover:underline" href={`mailto:${SUPPORT}`}>
            {SUPPORT}
          </a>
          . We will respond within <strong>30 days</strong> unless the request is unusually complex, in which case we may
          extend as permitted by law and will inform you.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We implement technical and organisational measures appropriate to the risk, including encryption in transit,
          access controls, separation of environments and staff training. No method of transmission over the Internet is
          completely secure; we encourage you to use strong passwords and protect your devices.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          We use cookies and similar technologies where necessary for the operation of the site (e.g. security,
          load-balancing, consent storage). Optional analytics or marketing cookies, if any, are used only with your
          consent where required. You can control cookies through your browser settings and our cookie banner where
          provided.
        </p>
      </LegalSection>

      <LegalSection title="10. Children">
        <p>
          Our services are not directed at children under 16. We do not knowingly collect personal data from children.
          If you believe we have done so, contact us and we will delete the information.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes">
        <p>
          We may update this Privacy Policy to reflect legal, technical or business changes. The “Last updated” date will
          change accordingly. Material changes may be communicated by email or a prominent notice on the site where
          appropriate.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Data controller: ArbeidMatch Norge AS
          <br />
          Privacy and data rights:{" "}
          <a className="font-medium text-[#C9A84C] underline-offset-4 hover:underline" href={`mailto:${SUPPORT}`}>
            {SUPPORT}
          </a>
          <br />
          General enquiries: post@arbeidmatch.no
        </p>
        <p className="pt-4 text-[14px] text-white/50">
          Related:{" "}
          <Link className="text-[#C9A84C]/90 underline-offset-4 hover:underline" href="/terms">
            Terms of Service
          </Link>
        </p>
      </LegalSection>
    </LegalDocShell>
  );
}
