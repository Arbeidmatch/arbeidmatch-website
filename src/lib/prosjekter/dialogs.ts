/**
 * The portal's forms open in a dialog over the page, never on a page of their
 * own (the owner's decision of 29 September 2026). Any link can open one by
 * its hash: `#tilgang` (or `#invitasjon`) asks for an invitation, `#logg-inn` sends a login link. These
 * are the pure parts: which hash is which dialog, and whether a link that was
 * clicked should open a dialog here instead of navigating.
 */

export type PortalDialog = "tilgang" | "logg-inn";

export const PORTAL_DIALOGS: readonly PortalDialog[] = ["tilgang", "logg-inn"];

/**
 * Other names a hash may use for a dialog. "#invitasjon" opens the same form
 * as "#tilgang": since 17 October 2026 it asks for an invitation, and links
 * already sent with #tilgang keep working.
 */
const HASH_ALIASES: Record<string, PortalDialog> = { invitasjon: "tilgang" };

/** The dialog a location hash asks for, or null. Accepts "#tilgang", "tilgang" and "#invitasjon". */
export function dialogFromHash(hash: string | null | undefined): PortalDialog | null {
  const h = String(hash ?? "").replace(/^#/, "").trim().toLowerCase();
  if (HASH_ALIASES[h]) return HASH_ALIASES[h];
  return (PORTAL_DIALOGS as readonly string[]).includes(h) ? (h as PortalDialog) : null;
}

/** The hash that opens a dialog, with its "#". */
export function hashFor(dialog: PortalDialog): string {
  return `#${dialog}`;
}

function normPath(p: string): string {
  const s = p.replace(/\/+$/, "");
  return s === "" ? "/" : s;
}

/**
 * The dialog a clicked link should open on the current page, or null when the
 * link should do what links do. Only a link to this very page opens in place:
 * "#tilgang", or "/prosjekter#tilgang" while on /prosjekter. A link to another
 * page with the hash navigates there, and the dialog opens on arrival.
 */
export function dialogForLink(href: string | null | undefined, currentPath: string, origin: string): PortalDialog | null {
  const raw = String(href ?? "").trim();
  if (!raw.includes("#")) return null;
  let url: URL;
  try {
    url = new URL(raw, `${origin}${currentPath}`);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  if (normPath(url.pathname) !== normPath(currentPath)) return null;
  return dialogFromHash(url.hash);
}

/** Each dialog's title, how wide it opens on a desktop, and a mark beside the title. */
export const DIALOG_META: Record<PortalDialog, { title: string; size: "wide" | "narrow"; badge?: string }> = {
  tilgang: { title: "Be om invitasjon", size: "wide", badge: "Beta" },
  "logg-inn": { title: "Logg inn", size: "narrow" },
};
