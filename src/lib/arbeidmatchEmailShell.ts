import { escapeHtml } from "@/lib/htmlSanitizer";
import { SUPPORT_PAGE_URL } from "@/lib/supportPage";

/**
 * The ArbeidMatch letter, as the website sends it.
 *
 * THE SOURCE IS THE ATS. This is a port of `buildArbeidmatchPremiumEmailHtml` in
 * ats-recruitment `src/lib/email-templates/premium-shell.ts`, with the brand
 * values of `src/lib/brand/notifications.ts`. The owner chose that look on
 * 10 August 2026 from two rendered options, and settled the order at the foot on
 * 8 and 16 August. Change it there first and copy it here, never the other way.
 *
 * WHY THE WEBSITE NEEDS ITS OWN COPY. On 10 September 2026 a request from
 * Grigore Delivery reached post@ and the client in the site's dark template, and
 * the owner's word was that it does not line up with our emails. It did not: the
 * site had two templates of its own (`emailTemplate.ts`, navy, and
 * `emailPremiumTemplate.ts`, a gold band), and neither is the letter the ATS
 * sends. A client who writes to us through the site and is answered from the ATS
 * got two different companies. The confirmation has to leave at once, so it
 * cannot wait in the ATS queue for approval; it leaves from here, in the same
 * envelope.
 */

export const BRAND = {
  ink: "#0D1B2A",
  gold: "#C9A84C",
  goldMuted: "#a8871f",
  ground: "#ffffff",
  panel: "#f7f8fa",
  rule: "#e2e8f0",
  bodySoft: "#4a5b6d",
  legal: "#6b7c8d",
  wordmarkFont: "Georgia,'Times New Roman',serif",
  bodyFont: "ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif",
  // The ATS's 192px emblem, served from this site (public/brand): the ATS host
  // answers mail clients' image fetches with a bot challenge, which broke the logo.
  logoUrl: "https://www.arbeidmatch.no/brand/arbeidmatch-emblem-email.png",
  logoSize: 72,
} as const;

/**
 * Who a letter is written to. Kept so callers can say it; since R106d it no
 * longer changes the contact box, which is the same support link for everybody.
 *
 * R106d, the owner's rule confirmed 6 October 2026 ("oriunde ... sa nu mai fie
 * public niciun email", and no telephone anywhere), after the ATS
 * `contactBlockInnerHtml`: the foot of every mail carries the support page and
 * nothing else to write to or ring. The office line ("Kontoret", the telephone,
 * post@), the candidate's cv@ and the support@ box are gone from the foot. A
 * letter that asks for a CV says cv@ in its own body.
 */
export type EmailAudience = "candidate" | "client" | "support";

const COMPANY_LEGAL = {
  name: "ArbeidMatch Norge AS",
  orgNr: "935 667 089",
  address: "Sverre Svendsens veg 38, 7056 Ranheim, Norway",
  site: "arbeidmatch.no",
} as const;

export type EmailLang = "no" | "en";

const WORDS = {
  no: {
    // The ATS SUPPORT_CTA_WORDS (lib/brand/support-contact.ts), word for word.
    supportCta: "Spørsmål? Kontakt vår support",
    replyLead: "Svar på denne e-posten går til:",
    unsubscribe: "Meld av",
    why: "Du får denne e-posten fordi du er i kontakt med ArbeidMatch.",
    internal: "Intern melding. Ingen avmelding.",
    confidentialTo: (to: string) =>
      `Denne meldingen er fortrolig og er adressert til ${to}. Har den kommet feil, gi oss beskjed, så fjerner vi adressen.`,
    confidentialNoTo: "Denne meldingen er fortrolig og er kun ment for mottakeren.",
    // As the ATS says it since 13 September 2026: the system is RecOS beta (the
    // owner's wording, 10 September), and no "svar på denne e-posten" here,
    // because a letter that asks for a reply in its body then said it twice.
    ownSystem: "Sendt fra vårt eget system, RecOS beta. Ser du feil i tekst eller oppsett, si gjerne ifra.",
  },
  en: {
    supportCta: "Questions? Contact our support",
    replyLead: "A reply to this e-mail reaches:",
    unsubscribe: "Unsubscribe",
    why: "You are receiving this because you are in contact with ArbeidMatch.",
    internal: "Internal notice. No unsubscribe.",
    confidentialTo: (to: string) =>
      `This message is confidential and is addressed to ${to}. If it reached you by mistake, tell us and we will remove the address.`,
    confidentialNoTo: "This message is confidential and is meant for the addressed recipient only.",
    ownSystem: "Sent from our own system, RecOS beta. If you notice an error in the text or layout, please let us know.",
  },
} as const;

/** A paragraph of the letter. `html` is trusted: escape what a person typed before passing it. */
export function letterParagraph(html: string): string {
  return `<p style="margin:0 0 14px;">${html}</p>`;
}

/**
 * Label and value, one row each, on the grey panel with the gold edge.
 *
 * Every label and value is its own cell on purpose: the ATS reads the internal
 * copy of a request back out of Gmail (`form-notification-parser.ts`), and it
 * finds a field by its label at the start of a line. A cell ends a line when the
 * mail is flattened; two values sharing one would read as one answer.
 */
export type LetterFactRow = {
  label: string;
  value: string;
  /**
   * A number that is not a telephone number, such as an org number: mail
   * clients turn nine digits into a "call" link on their own (seen on the
   * receipt, 25 September 2026). An anchor of our own, inert and in the text's
   * colour, is the one thing they leave alone.
   */
  noLink?: boolean;
};

export function letterFacts(rows: LetterFactRow[]): string {
  const visible = rows.filter((r) => r.value.trim() !== "");
  if (visible.length === 0) return "";
  const cell = (r: LetterFactRow) => {
    const text = escapeHtml(r.value).replace(/\r?\n/g, "<br/>");
    return r.noLink ? `<a href="#" style="color:${BRAND.ink};text-decoration:none;pointer-events:none;cursor:text;">${text}</a>` : text;
  };
  const body = visible
    .map(
      (r) => `<tr>
        <td width="38%" style="width:38%;padding:6px 12px 6px 0;vertical-align:top;font-size:13px;line-height:1.5;color:${BRAND.bodySoft};">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;vertical-align:top;font-size:14px;line-height:1.5;color:${BRAND.ink};word-break:break-word;overflow-wrap:anywhere;">${cell(r)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 18px;"><tr><td style="background:${BRAND.panel};border-left:2px solid ${BRAND.gold};padding:10px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${body}</table>
  </td></tr></table>`;
}

/** A heading inside the letter, for a letter long enough to need sections. */
export function letterHeading(text: string): string {
  return `<p style="margin:22px 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.goldMuted};font-weight:600;">${escapeHtml(text)}</p>`;
}

/** Small print inside the letter: an expiry, a disclaimer, what to do if the button fails. `html` is trusted. */
export function letterNote(html: string): string {
  return `<p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:${BRAND.bodySoft};">${html}</p>`;
}

/** A one-time code, large enough to read off a phone and copy by hand. Digits only. */
export function letterCode(code: string): string {
  const digits = code.replace(/\D/g, "");
  return `<p style="margin:8px 0 22px;font-size:32px;line-height:1.2;font-weight:700;letter-spacing:0.25em;color:${BRAND.ink};">${digits}</p>`;
}

/** Text kept exactly as it was written or thrown: a message, a stack trace. Escaped here. */
export function letterPre(text: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;table-layout:fixed;margin:0 0 18px;"><tr><td style="background:${BRAND.panel};border-left:2px solid ${BRAND.rule};padding:10px 14px;font-family:ui-monospace,Consolas,'Courier New',monospace;font-size:12px;line-height:1.55;color:${BRAND.ink};white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(text)}</td></tr></table>`;
}

/**
 * The line an inbox shows under the subject. The ATS `emailPreheaderText`.
 *
 * Without one, Gmail builds the preview from the first words it finds, which in
 * this envelope are the wordmark and the heading: the brand and the subject
 * again. So the letter carries a hidden preheader: what the caller gave, or
 * else the first sentence of the letter that is not a greeting.
 */
export function emailPreheaderText(innerHtml: string, explicit?: string | null): string {
  const given = String(explicit ?? "").trim();
  if (given) return given.slice(0, 160);
  const blocks = String(innerHtml ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .split(/<\/(?:p|li|h\d|div|tr)>|<br\s*\/?>/i)
    .map((b) =>
      b
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
  const first = blocks.find((b) => !/^(hi|hei|hello|dear|kjære|hej|salut|buna)\b[^.!?]{0,60},?$/i.test(b)) ?? "";
  const sentence = /^(.{20,}?[.!?])(\s|$)/.exec(first)?.[1] ?? first;
  return sentence.slice(0, 160);
}

function preheaderHtml(text: string): string {
  if (!text) return "";
  // The run of zero-width non-joiners stops a client pulling body text in after the preheader.
  const filler = "&#8204;&nbsp;".repeat(40);
  return `<!--AM_PREHEADER--><div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;">${escapeHtml(text)}${filler}</div><!--/AM_PREHEADER-->`;
}

export function buildArbeidmatchLetter(args: {
  title: string;
  innerHtml: string;
  cta?: { href: string; label: string } | null;
  lang?: EmailLang;
  /** A notice to the office: no unsubscribe, which on an alert would silently turn the alerts off. */
  internal?: boolean;
  unsubscribeUrl?: string;
  /** Named in the confidentiality line. */
  recipient?: string | null;
  /** Who the letter is written to. Since R106d every reader gets the same support link. */
  audience?: EmailAudience;
  /**
   * The desk this letter came from. Accepted and no longer printed (R106d): the
   * reply reaches the desk through Reply-To, and the foot carries the support
   * link only.
   */
  contactEmail?: string | null;
  /** The hidden line an inbox shows under the subject. Absent means the letter's first sentence. */
  preheader?: string | null;
  /**
   * A person a reply reaches, as on the ATS's first letters to a firm (the
   * owner, 24 September 2026: "Mirel Manoliu contact person"), printed above the
   * support link. His decision, kept as it was; the telephone is accepted and
   * never printed (R106d). No route passes one today.
   */
  contactPerson?: { name: string; phone?: string | null; email: string } | null;
  /**
   * A letter about something the reader asked for, such as the receipt of a
   * request: it says why it came and carries no unsubscribe link. His decision of
   * 16 September 2026, no unsubscribe on service letters.
   */
  serviceLetter?: boolean;
}): string {
  const lang: EmailLang = args.lang === "en" ? "en" : "no";
  const w = WORDS[lang];
  const unsub = args.unsubscribeUrl?.trim() || "#";

  const ctaBlock = args.cta
    ? `<tr><td style="padding:4px 26px 0;">
        <a href="${escapeHtml(args.cta.href)}" style="display:inline-block;background:${BRAND.ink};color:#ffffff;padding:14px 28px;border-radius:3px;font-weight:600;font-size:15px;line-height:1.2;text-decoration:none;border-bottom:2px solid ${BRAND.gold};">${escapeHtml(args.cta.label)}</a>
      </td></tr>`
    : "";

  /**
   * THE CONTACT BOX IS THE SUPPORT LINK, FOR EVERY READER (R106d, 6 October
   * 2026). It used to give a client the office ("Kontoret", the telephone and
   * post@), a candidate cv@ and a code letter support@. The ATS made the same
   * change in `contactBlockInnerHtml`; the words are its SUPPORT_CTA_WORDS.
   */
  const supportLink = `<a href="${escapeHtml(SUPPORT_PAGE_URL)}" style="color:${BRAND.goldMuted};text-decoration:none;font-weight:600;">${w.supportCta}</a>`;
  const person = args.contactPerson?.name.trim() && args.contactPerson.email.trim() ? args.contactPerson : null;
  const contactInner = person
    ? `${w.replyLead}<br/>
          <strong style="color:${BRAND.ink};">${escapeHtml(person.name.trim())}</strong>
          &middot;
          <a href="mailto:${escapeHtml(person.email.trim())}" style="color:${BRAND.goldMuted};text-decoration:none;">${escapeHtml(person.email.trim())}</a><br/>
          ${supportLink}`
    : supportLink;
  const contactBlock = `<tr><td style="padding:26px 26px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr><td style="background:${BRAND.panel};border-left:2px solid ${BRAND.gold};padding:14px 16px;font-size:14px;line-height:1.6;color:${BRAND.bodySoft};">
          ${contactInner}
        </td></tr>
      </table>
    </td></tr>`;

  const legal = `${COMPANY_LEGAL.name} &middot; Org.nr ${COMPANY_LEGAL.orgNr}<br/>
      ${COMPANY_LEGAL.address}<br/>
      <a href="https://${COMPANY_LEGAL.site}" style="color:${BRAND.goldMuted};text-decoration:none;">${COMPANY_LEGAL.site}</a>`;

  // No alt text: the wordmark at the top already names the company, and with
  // images blocked a clipped "ArbeidMat" in a 72px box was all a reader saw
  // (the ATS, 13 September 2026).
  const logoBlock = `<tr><td style="padding:14px 0 4px;">
        <img src="${BRAND.logoUrl}" width="${BRAND.logoSize}" height="${BRAND.logoSize}" alt="" style="display:block;border:0;outline:none;width:${BRAND.logoSize}px;height:${BRAND.logoSize}px;">
      </td></tr>`;

  const to = String(args.recipient ?? "").trim();
  const confidential = escapeHtml(`${to ? w.confidentialTo(to) : w.confidentialNoTo} ${w.ownSystem}`);
  const footerTail = args.internal
    ? w.internal
    : args.serviceLetter
    ? w.why
    : `${w.why} <a href="${escapeHtml(unsub)}" style="color:${BRAND.goldMuted};">${w.unsubscribe}</a>`;

  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${BRAND.ground};">
${preheaderHtml(emailPreheaderText(args.innerHtml, args.preheader))}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.ground};border-collapse:collapse;">
<tr><td align="center" style="padding:20px 12px 32px;font-family:${BRAND.bodyFont};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border-collapse:collapse;">
    <tr>
      <td style="background:${BRAND.ground};padding:22px 26px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:middle;font-family:${BRAND.wordmarkFont};font-size:22px;letter-spacing:0.01em;color:${BRAND.ink};">
              ArbeidMatch
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="background:${BRAND.gold};height:2px;line-height:2px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="background:${BRAND.ground};padding:30px 26px 4px;font-family:${BRAND.bodyFont};color:${BRAND.ink};">
        <h1 style="font-size:21px;font-weight:700;margin:0 0 16px;line-height:1.3;letter-spacing:-0.01em;color:${BRAND.ink};">${escapeHtml(args.title)}</h1>
        <div style="font-size:15px;line-height:1.65;color:${BRAND.ink};">${args.innerHtml}</div>
      </td>
    </tr>
    ${ctaBlock}
    ${contactBlock}
    <tr>
      <td style="padding:26px 26px 0;font-family:${BRAND.bodyFont};">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr><td style="border-top:1px solid ${BRAND.rule};padding-top:14px;font-size:12px;line-height:1.65;color:${BRAND.legal};">
            ${legal}
          </td></tr>
          ${logoBlock}
          <tr><td style="padding-top:14px;font-size:12px;line-height:1.65;color:${BRAND.legal};">
            ${confidential}<br/><br/>
            ${footerTail}
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</td></tr></table>
</body></html>`;
}
