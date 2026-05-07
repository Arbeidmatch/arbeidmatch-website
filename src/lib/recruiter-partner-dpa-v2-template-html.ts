/**
 * Official recruiter partner DPA v2 template (HTML, with merge placeholders).
 * Not published as a public website page; provided to partners through the recruitment flow.
 */
export const RECRUITER_PARTNER_DPA_V2_TEMPLATE_HTML = `<article class="recruiter-partner-dpa-v2">
<h1>DATA PROCESSING AGREEMENT</h1>

<p><strong>Between:</strong></p>

<p><strong>Controller:</strong> {{PARTNER_COMPANY_LEGAL_NAME}}, Org. nr.: {{PARTNER_ORG_NUMBER}}, registered at {{PARTNER_ADDRESS}} ("Controller" or "Recruiter Partner")</p>

<p><strong>Processor:</strong> ArbeidMatch Norge AS, Org. nr.: {{PROCESSOR_ORG_NUMBER}}, registered at {{PROCESSOR_REGISTERED_ADDRESS}} ("Processor" or "ArbeidMatch")</p>

<p><strong>Effective from:</strong> {{ACCEPTANCE_DATE}}</p>

<h2>1. DEFINITIONS</h2>
<p>Terms used herein shall have the meaning ascribed to them in Regulation (EU) 2016/679 ("GDPR") and the Norwegian Personal Data Act (Personopplysningsloven). "Personal Data," "Processing," "Data Subject," "Sub-Processor," and "Personal Data Breach" carry their GDPR meanings.</p>

<h2>2. SUBJECT MATTER AND DURATION</h2>
<p>The Processor processes Personal Data on behalf of the Controller for the sole purpose of operating the ArbeidMatch recruitment platform and facilitating placement of candidates introduced by the Controller with end-employers in Norway. This Agreement remains in effect for as long as the Controller maintains an active account on the ArbeidMatch platform and survives termination with respect to ongoing confidentiality and data return obligations.</p>

<h2>3. NATURE AND PURPOSE OF PROCESSING</h2>
<p>The Processor will process Personal Data exclusively to:</p>
<ul>
<li>Store candidate profiles introduced by the Controller</li>
<li>Match candidates with employer requests within the platform</li>
<li>Facilitate communication between the Controller, candidates, and end-employers</li>
<li>Generate placement records and commission calculations</li>
<li>Comply with the Controller's documented instructions</li>
</ul>
<p>The Processor shall not process Personal Data for any other purpose, including marketing, profiling unrelated to recruitment, or sale to third parties.</p>

<h2>4. CATEGORIES OF PERSONAL DATA</h2>
<ul>
<li><strong>Identification data:</strong> full name, date of birth, nationality</li>
<li><strong>Contact data:</strong> email, phone, address</li>
<li><strong>Professional data:</strong> CV content, employment history, qualifications, certifications, references</li>
<li><strong>Work eligibility data:</strong> work permits, residence status, D-number/personal number where applicable</li>
<li><strong>Communication data:</strong> messages exchanged via the platform</li>
</ul>

<h2>5. CATEGORIES OF DATA SUBJECTS</h2>
<p>Job candidates introduced by the Controller through invitation links, manual upload, or platform-integrated channels.</p>

<h2>6. CONTROLLER'S OBLIGATIONS</h2>
<p>The Controller warrants that:</p>
<ol type="a">
<li>It has a valid legal basis under GDPR Article 6 for sharing each candidate's Personal Data with the Processor (typically consent or legitimate interest)</li>
<li>It has provided each candidate with a transparent privacy notice meeting GDPR Article 13/14 requirements</li>
<li>It will not introduce candidates whose Personal Data was obtained unlawfully</li>
<li>It will respond promptly to data subject requests forwarded by the Processor</li>
</ol>

<h2>7. PROCESSOR'S OBLIGATIONS</h2>
<p>The Processor shall:</p>
<ol type="a">
<li>Process Personal Data only on documented instructions from the Controller</li>
<li>Ensure persons authorized to process Personal Data are bound by confidentiality</li>
<li>Implement appropriate technical and organizational measures (Section 9)</li>
<li>Assist the Controller in fulfilling data subject requests within 30 days</li>
<li>Assist the Controller with data protection impact assessments and consultations with supervisory authorities upon request</li>
<li>Notify the Controller without undue delay (and in any case within 48 hours) upon becoming aware of a Personal Data Breach</li>
<li>At the Controller's choice, delete or return all Personal Data after termination, save where Union or Member State law requires retention</li>
</ol>

<h2>8. SUB-PROCESSORS</h2>
<p>The Controller grants general authorization for the Processor to engage Sub-Processors. Current Sub-Processors:</p>
<ul>
<li>Supabase Inc. — database hosting (EU/Frankfurt region)</li>
<li>Vercel Inc. — application hosting (EU regions)</li>
<li>One.com A/S — email infrastructure (EU/Denmark)</li>
<li>Stripe Payments Europe Ltd. — payment processing (when commission payouts are activated)</li>
</ul>
<p>The Processor shall maintain an updated list at <a href="https://arbeidmatch.no/subprocessors">https://arbeidmatch.no/subprocessors</a> and notify the Controller of intended changes 30 days in advance via email. The Controller may object on reasonable data protection grounds; if no resolution is reached, the Controller may terminate this Agreement. The Processor remains fully liable for the acts and omissions of its Sub-Processors.</p>

<h2>9. SECURITY MEASURES (GDPR ARTICLE 32)</h2>
<p>The Processor implements:</p>
<ul>
<li><strong>Encryption:</strong> TLS 1.3 in transit; AES-256 at rest</li>
<li><strong>Access control:</strong> role-based permissions, least-privilege principle, MFA for administrative accounts</li>
<li><strong>Audit logging:</strong> all access and modifications recorded with retention of 12 months</li>
<li><strong>Pseudonymization:</strong> applied upon erasure requests where full deletion is technically constrained</li>
<li><strong>Backup:</strong> encrypted daily backups, retention 30 days</li>
<li><strong>Incident response:</strong> documented procedure with 48-hour internal escalation</li>
<li><strong>Personnel:</strong> background checks for employees with production access; mandatory data protection training</li>
</ul>

<h2>10. PERSONAL DATA BREACH NOTIFICATION</h2>
<p>In the event of a Personal Data Breach, the Processor shall notify the Controller without undue delay and in any case within 48 hours of becoming aware. The notification shall include:</p>
<ol type="a">
<li>Nature of the breach and categories/approximate number of data subjects and records affected</li>
<li>Likely consequences</li>
<li>Measures taken or proposed to address the breach and mitigate effects</li>
<li>Contact details of the data protection contact</li>
</ol>
<p>The Controller is responsible for any onward notification to supervisory authorities (Datatilsynet) and data subjects under GDPR Articles 33-34.</p>

<h2>11. AUDIT RIGHTS</h2>
<p>The Controller may, no more than once per calendar year and with 30 days' written notice, request:</p>
<ol type="a">
<li>Written confirmation of the Processor's compliance with this Agreement</li>
<li>Copies of the Processor's most recent security audit reports (e.g., SOC 2, ISO 27001) where available</li>
<li>An on-site audit conducted at the Controller's expense, subject to reasonable confidentiality obligations and during business hours</li>
</ol>
<p>In the event of a documented Personal Data Breach affecting the Controller's data, audit rights may be exercised more frequently.</p>

<h2>12. INTERNATIONAL TRANSFERS</h2>
<p>Personal Data is processed within the European Economic Area (EEA). The Processor shall not transfer Personal Data outside the EEA without ensuring adequate protection through Standard Contractual Clauses or another lawful transfer mechanism, and shall notify the Controller in advance.</p>

<h2>13. DATA RETENTION AND RETURN</h2>
<p>Upon termination of this Agreement or upon the Controller's written request:</p>
<ul>
<li><strong>Active candidate data:</strong> returned in machine-readable format (JSON/CSV) within 30 days</li>
<li><strong>All copies (including backups):</strong> deleted within 90 days, except where legal retention applies (e.g., financial records under Norwegian Bookkeeping Act, retained for 5 years)</li>
<li><strong>Inactive candidates</strong> (no platform activity for 24 consecutive months): automatically anonymized</li>
</ul>

<h2>14. LIABILITY</h2>
<p>Each party's liability under this Agreement is limited as set forth in the master ArbeidMatch Recruiter Partner Agreement. Notwithstanding any limitation, neither party may exclude liability for:</p>
<ul>
<li>Willful misconduct or gross negligence</li>
<li>Breach of confidentiality obligations</li>
<li>Fines imposed by supervisory authorities directly attributable to that party's breach</li>
</ul>

<h2>15. GOVERNING LAW AND JURISDICTION</h2>
<p>This Agreement is governed by Norwegian law. Disputes shall be submitted exclusively to the courts of Trondheim (Sør-Trøndelag tingrett), Norway.</p>

<h2>16. ELECTRONIC ACCEPTANCE</h2>
<p>By clicking "I accept" within the ArbeidMatch onboarding flow, the Controller acknowledges having read, understood, and agreed to be legally bound by this Agreement. This electronic acceptance constitutes a binding agreement under Norwegian contract law (Avtaleloven). The Processor records the timestamp, IP address, and user agent for evidentiary purposes. This is not a Qualified Electronic Signature under eIDAS Regulation (EU) 910/2014. For high-formality agreements requiring QES, parties may execute a separate signed addendum.</p>

<h2>17. SIGNATURES</h2>
<p><strong>Controller — {{PARTNER_COMPANY_LEGAL_NAME}}</strong><br />
Accepted electronically by: {{PARTNER_FULL_NAME}}<br />
Title: {{PARTNER_TITLE}}<br />
Date: {{ACCEPTANCE_DATE}}<br />
IP: {{ACCEPTANCE_IP}}</p>

<p><strong>Processor — ArbeidMatch Norge AS</strong><br />
{{PROCESSOR_SIGNATORY_LINE}}</p>
</article>`;
