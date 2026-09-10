import { buildArbeidmatchLetter, letterHeading, letterNote, letterParagraph } from "@/lib/arbeidmatchEmailShell";
import { escapeHtml } from "@/lib/htmlSanitizer";

/**
 * Lead magnet for non-EU candidates who request the free overview, in the
 * ArbeidMatch letter. A candidate letter: the contact box gives cv@, never the
 * office line (the ATS rule of 16 August 2026).
 */
export function buildNonEuLeadEmail(firstName: string, recipientEmail: string, unsubscribeToken?: string): string {
  const name = escapeHtml(firstName);
  const body = [
    letterParagraph(`Hi ${name},`),
    letterParagraph(
      "Most non-EU workers who want to work in Norway focus on finding a job first. That is actually the last step, not the first.",
    ),
    letterParagraph(
      "Before a Norwegian employer can legally hire you, several things need to be in place. Most people only discover this after they have already made plans, spent money, or turned down other opportunities.",
    ),
    letterHeading("What most guides leave out"),
    letterParagraph(
      "There is a specific sequence to the process. Doing things in the wrong order does not just slow you down. It can disqualify your application entirely or cost you months of waiting.",
    ),
    letterParagraph(
      "The sequence depends on your trade, your country of origin, and the type of employer you are targeting. There is no single answer that works for everyone.",
    ),
    letterParagraph(
      "ArbeidMatch works with Norwegian employers in construction, logistics, and industry. We see which candidates get placed quickly and which ones get stuck. The difference is almost always preparation, not qualifications.",
    ),
    letterHeading("Want to know where to start?"),
    letterParagraph(
      "Reply to this email with your trade and country of origin. We will tell you what the first step looks like for your specific situation. No cost, no obligation.",
    ),
    letterParagraph(
      "If you are an electrician specifically, we also have a dedicated authorization guide. Just mention it in your reply.",
    ),
    letterNote(
      "We are also working on a complete Norway Work Guide for non-EU workers. When it is ready, you will be among the first to receive it.",
    ),
    letterNote(
      "ArbeidMatch Norge AS is a private recruitment agency, not an official Norwegian authority. Information shared is general guidance only.",
    ),
  ].join("");

  return buildArbeidmatchLetter({
    title: "You asked about working in Norway",
    innerHtml: body,
    lang: "en",
    audience: "candidate",
    recipient: recipientEmail,
    unsubscribeUrl: unsubscribeToken
      ? `https://arbeidmatch.no/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
      : `mailto:post@arbeidmatch.no?subject=${encodeURIComponent(`Unsubscribe ${recipientEmail}`)}`,
  });
}
