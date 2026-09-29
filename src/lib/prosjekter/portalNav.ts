import { isProjectToken } from "@/lib/prosjekter/format";

/**
 * The header's actions on the project portal (/prosjekter and everything
 * under it). The site's "Sign Up" is for job seekers and confused clients
 * there, so the portal has its own two: a quiet way in for clients who have
 * access, and the gold one for firms that want it. On a client's own page
 * (/prosjekter/<token>) the way in is already taken, so it reads "Min side"
 * and the gold button leads back to the map.
 *
 * Returns null everywhere else, where the header stays as it is.
 */

export type PortalLink = { label: string; href: string };
export type PortalHeader = { quiet: PortalLink; gold: PortalLink };

export function isPortalPath(pathname: string | null | undefined): boolean {
  const p = String(pathname ?? "");
  // A one-project presentation (/prosjekt/<token>) is part of the portal too.
  return p === "/prosjekter" || p.startsWith("/prosjekter/") || p.startsWith("/prosjekt/");
}

export function portalHeader(pathname: string | null | undefined): PortalHeader | null {
  if (!isPortalPath(pathname)) return null;
  const segments = String(pathname).split("/").filter(Boolean);
  const own = segments.length === 2 && isProjectToken(segments[1]);
  if (own) {
    return {
      quiet: { label: "Min side", href: `/prosjekter/${segments[1]}` },
      gold: { label: "Prosjektkartet", href: "/prosjekter" },
    };
  }
  return {
    quiet: { label: "Logg inn", href: "/prosjekter/logg-inn" },
    gold: { label: "Få tilgang", href: "/prosjekter#tilgang" },
  };
}
