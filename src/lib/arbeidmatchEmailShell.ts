import { escapeHtml } from "@/lib/htmlSanitizer";

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
  logoUrl: "https://ats.arbeidmatch.no/brand/arbeidmatch-emblem.png",
  logoSize: 72,
} as const;

/**
 * Which address a reader is told to write to. The ATS `BRAND_CONTACT`.
 *
 * The owner's rule, 10 August 2026: candidates write to cv@, not to post@ or
 * support@. A candidate writing to the general post box lands in the same inbox
 * as invoices and supplier mail, and what he is sending is almost always the one
 * thing the recruitment side is waiting for. Clients keep the main address.
 */
const BRAND_CONTACT = {
  candidate: { name: "Kontoret", phone: "+47 967 34 730", email: "cv@arbeidmatch.no" },
  client: { name: "Kontoret", phone: "+47 967 34 730", email: "post@arbeidmatch.no" },
  /** No phone, no desk name: a code or a status check goes to the mailbox, not a call. */
  support: { name: "Kontoret", phone: "", email: "support@arbeidmatch.no" },
} as const;

export type EmailAudience = keyof typeof BRAND_CONTACT;

/** Local parts that cannot take a reply, after the ATS `no-reply-address.ts`. */
const NO_REPLY_EXACT = new Set(["postmaster", "mailer-daemon", "mailerdaemon", "mailer_daemon", "bounce", "bounces", "abuse"]);

/**
 * The desk a letter came from, when it came from a desk. The ATS `deskContactEmail`.
 *
 * Only one of our own @arbeidmatch.no addresses is printed: this line tells the
 * reader where to write to us, and somebody else's address in it is worse than
 * the default. A box that refuses mail is not somewhere to send an answer, and
 * the general inbox is already the default, so neither is worth printing. The
 * general inbox is not a desk, which keeps the candidate rule standing: naming
 * post@ would put the office box where a candidate must be given cv@.
 */
function deskContactEmail(from: string | null | undefined): string | null {
  const angled = /<([^>]+)>/.exec(String(from ?? ""));
  const address = (angled ? angled[1]! : String(from ?? "")).trim().toLowerCase();
  if (!/^[^\s@]+@arbeidmatch\.no$/.test(address)) return null;
  const local = address.slice(0, address.lastIndexOf("@"));
  const collapsed = local.replace(/[.\-_+]/g, "");
  if (NO_REPLY_EXACT.has(local) || collapsed.includes("noreply") || collapsed.includes("donotreply")) return null;
  return address === BRAND_CONTACT.client.email ? null : address;
}

const COMPANY_LEGAL = {
  name: "ArbeidMatch Norge AS",
  orgNr: "935 667 089",
  address: "Sverre Svendsens veg 38, 7056 Ranheim, Trondheim",
  site: "arbeidmatch.no",
} as const;

export type EmailLang = "no" | "en";

const WORDS = {
  no: {
    contactLead: "Har du spørsmål, ta kontakt:",
    supportLead: "Har du spørsmål, skriv til:",
    unsubscribe: "Meld av",
    cvLead: "Vil du komme i kontakt, send CV-en din til:",
    why: "Du får denne e-posten fordi du er i kontakt med ArbeidMatch.",
    internal: "Intern melding. Ingen avmelding.",
    confidentialTo: (to: string) =>
      `Denne meldingen er fortrolig og er adressert til ${to}. Har den kommet feil, gi oss beskjed, så fjerner vi adressen.`,
    confidentialNoTo: "Denne meldingen er fortrolig og er kun ment for mottakeren.",
    ownSystem:
      "E-posten er sendt fra vårt eget system, ArbeidMatch ATS. Ser noe feil ut i teksten eller i oppsettet, svar på denne e-posten, så retter vi det.",
  },
  en: {
    contactLead: "Any questions, write or call:",
    supportLead: "Any questions, write to:",
    unsubscribe: "Unsubscribe",
    cvLead: "If you want to reach us, send your CV to:",
    why: "You are receiving this because you are in contact with ArbeidMatch.",
    internal: "Internal notice. No unsubscribe.",
    confidentialTo: (to: string) =>
      `This message is confidential and is addressed to ${to}. If it reached you by mistake, tell us and we will remove the address.`,
    confidentialNoTo: "This message is confidential and is meant for the addressed recipient only.",
    ownSystem:
      "It was sent from our own system, ArbeidMatch ATS. If anything looks wrong in the text or in the layout, reply to this email and we will correct it.",
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
export function letterFacts(rows: { label: string; value: string }[]): string {
  const visible = rows.filter((r) => r.value.trim() !== "");
  if (visible.length === 0) return "";
  const body = visible
    .map(
      (r) => `<tr>
        <td width="38%" style="width:38%;padding:6px 12px 6px 0;vertical-align:top;font-size:13px;line-height:1.5;color:${BRAND.bodySoft};">${escapeHtml(r.label)}</td>
        <td style="padding:6px 0;vertical-align:top;font-size:14px;line-height:1.5;color:${BRAND.ink};word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(r.value).replace(/\r?\n/g, "<br/>")}</td>
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
  /** Decides which address the reader is told to write to. Clients keep post@. */
  audience?: EmailAudience;
  /**
   * The desk this letter came from, named back to the reader instead of the
   * default for his audience: a letter written from legal@ is answered at
   * legal@. The owner's correction in the ATS, 6 September 2026.
   */
  contactEmail?: string | null;
}): string {
  const lang: EmailLang = args.lang === "en" ? "en" : "no";
  const w = WORDS[lang];
  const unsub = args.unsubscribeUrl?.trim() || "#";
  const audience: EmailAudience = args.audience ?? "client";
  const brandContact = BRAND_CONTACT[audience];
  const contact = { ...brandContact, email: deskContactEmail(args.contactEmail) ?? brandContact.email };

  const ctaBlock = args.cta
    ? `<tr><td style="padding:4px 26px 0;">
        <a href="${escapeHtml(args.cta.href)}" style="display:inline-block;background:${BRAND.ink};color:#ffffff;padding:14px 28px;border-radius:3px;font-weight:600;font-size:15px;line-height:1.2;text-decoration:none;border-bottom:2px solid ${BRAND.gold};">${escapeHtml(args.cta.label)}</a>
      </td></tr>`
    : "";

  /**
   * A CANDIDATE IS NOT GIVEN THE OFFICE LINE. The owner's rule in the ATS, 16
   * August 2026, said twice because the first fix only swapped the address and
   * left the office phone standing above it. A man asking about work does not
   * ring the office; if he wants to reach us he sends his CV, and that is the
   * whole of what this box says to him.
   */
  const contactBlock =
    audience === "candidate"
      ? `<tr><td style="padding:26px 26px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr><td style="background:${BRAND.panel};border-left:2px solid ${BRAND.gold};padding:14px 16px;font-size:14px;line-height:1.6;color:${BRAND.bodySoft};">
          ${w.cvLead}<br/>
          <a href="mailto:${contact.email}" style="color:${BRAND.goldMuted};text-decoration:none;">${contact.email}</a>
        </td></tr>
      </table>
    </td></tr>`
      : audience === "support"
      ? `<tr><td style="padding:26px 26px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr><td style="background:${BRAND.panel};border-left:2px solid ${BRAND.gold};padding:14px 16px;font-size:14px;line-height:1.6;color:${BRAND.bodySoft};">
          ${w.supportLead}<br/>
          <a href="mailto:${contact.email}" style="color:${BRAND.goldMuted};text-decoration:none;">${contact.email}</a>
        </td></tr>
      </table>
    </td></tr>`
      : `<tr><td style="padding:26px 26px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tr><td style="background:${BRAND.panel};border-left:2px solid ${BRAND.gold};padding:14px 16px;font-size:14px;line-height:1.6;color:${BRAND.bodySoft};">
          ${w.contactLead}<br/>
          <strong style="color:${BRAND.ink};">${contact.name}</strong><br/>
          <a href="tel:${contact.phone.replace(/\s/g, "")}" style="color:${BRAND.goldMuted};text-decoration:none;">${contact.phone}</a>
          &middot;
          <a href="mailto:${contact.email}" style="color:${BRAND.goldMuted};text-decoration:none;">${contact.email}</a>
        </td></tr>
      </table>
    </td></tr>`;

  const legal = `${COMPANY_LEGAL.name} &middot; Org.nr ${COMPANY_LEGAL.orgNr}<br/>
      ${COMPANY_LEGAL.address}<br/>
      <a href="https://${COMPANY_LEGAL.site}" style="color:${BRAND.goldMuted};text-decoration:none;">${COMPANY_LEGAL.site}</a>`;

  const logoBlock = `<tr><td style="padding:14px 0 4px;">
        <img src="${BRAND.logoUrl}" width="${BRAND.logoSize}" height="${BRAND.logoSize}" alt="ArbeidMatch" style="display:block;border:0;outline:none;width:${BRAND.logoSize}px;height:${BRAND.logoSize}px;">
      </td></tr>`;

  const to = String(args.recipient ?? "").trim();
  const confidential = escapeHtml(`${to ? w.confidentialTo(to) : w.confidentialNoTo} ${w.ownSystem}`);
  const footerTail = args.internal
    ? w.internal
    : `${w.why} <a href="${escapeHtml(unsub)}" style="color:${BRAND.goldMuted};">${w.unsubscribe}</a>`;

  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${BRAND.ground};">
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
