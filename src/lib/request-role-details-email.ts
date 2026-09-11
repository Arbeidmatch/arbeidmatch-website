import { letterFacts, letterHeading } from "@/lib/arbeidmatchEmailShell";
import {
  buildRoleDetails,
  ROLE_DETAILS_HEADING,
  roleDetailLines,
  type RoleDetailRow,
  type RoleDetailsInput,
} from "@/lib/request-role-questions";

/**
 * The "Role details" section of the office letter, placed after the letter's
 * other sections.
 *
 * The rows are rebuilt here from the client's raw answers with the same code
 * the wizard uses, not taken from text the browser composed: the labels are
 * what the ATS parses, so they come from our config and never from a request
 * body. Each row is "Label: value" in the same two-cell shape as the sections
 * above it. Nothing is printed for a question left unanswered.
 */
export function roleDetailsEmailSection(rows: readonly RoleDetailRow[]): string {
  const facts = letterFacts([...rows]);
  return facts ? `${letterHeading(ROLE_DETAILS_HEADING)}${facts}` : "";
}

/** The office letter's rows and the owner's Slack rows, from one request body. */
export function roleDetailsFromRequest(input: RoleDetailsInput): { en: RoleDetailRow[]; ro: RoleDetailRow[] } {
  return { en: buildRoleDetails(input, "en"), ro: buildRoleDetails(input, "ro") };
}

/**
 * The client's requirements text without the "Role details" block the wizard
 * appended to it, for the Slack message: those answers are posted there as
 * fields of their own, in Romanian, and would otherwise be printed twice.
 * Only the exact lines this request produced are taken out.
 */
export function stripRoleDetailsBlock(requirements: string, rows: readonly RoleDetailRow[]): string {
  if (!requirements || rows.length === 0) return requirements;
  const drop = new Set([ROLE_DETAILS_HEADING, ...roleDetailLines(rows)]);
  return requirements
    .split(/\r?\n/)
    .filter((line) => !drop.has(line.trim()))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
