import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";
import { langForPath } from "@/lib/pageLang";
import { SUPPORT_PAGE_PATH } from "@/lib/supportPage";

/**
 * The shared shell of the site approved on 15 November 2026 (ORDER 295): where
 * each menu entry goes, which language a page speaks, and the one action its
 * header offers. Every address the header, the candidate tabs, the phone menu
 * and the footer link to is here, so a page that moves is changed once.
 */

export type SiteLang = "no" | "en";

export const SITE_PATHS = {
  home: "/",
  firms: "/for-employers",
  forsprang: "/prosjekter",
  candidates: "/for-candidates",
  jobs: "/jobs",
  lifeInNorway: "/premium",
  questions: "/for-candidates/questions",
  /** The candidates' own support page (ORDER 295, stage 3); /contact?support=1 stays the support door for everyone else. */
  support: "/for-candidates/support",
  supportAll: SUPPORT_PAGE_PATH,
  contact: "/contact",
  about: "/about",
  network: "/recruiter-network",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
  flislegger: "/flislegger",
  minSide: "/min-side",
  /** Opens the project portal's own log-in dialog over any page (PortalDialogs). */
  forsprangLogin: "#logg-inn",
  /** Opens the project portal's own invitation dialog over any page (PortalDialogs). */
  forsprangAccess: "#tilgang",
  candidateLogin: CANDIDATE_PORTAL_LOGIN_URL,
  candidateSignup: CANDIDATE_PORTAL_SIGNUP_URL,
  /** The request page; links carrying data-rask-foresporsel open its pop-up over the page. */
  request: "/request",
  feedback: "/feedback",
} as const;

export type CandidateTab = { href: string; label: string; short: string };

/** The five entries of the "For candidates" drop-down and of the tab row on every candidate page. */
export const CANDIDATE_TABS: readonly CandidateTab[] = [
  { href: SITE_PATHS.candidates, label: "Overview", short: "Overview" },
  { href: SITE_PATHS.jobs, label: "Open jobs", short: "Jobs" },
  { href: SITE_PATHS.lifeInNorway, label: "Life in Norway", short: "Norway" },
  { href: SITE_PATHS.questions, label: "Questions", short: "FAQ" },
  { href: SITE_PATHS.support, label: "Support", short: "Support" },
];

function clean(rawPath: string | null | undefined): string {
  return (String(rawPath ?? "/").split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
}

/** The pages that carry the candidate tab row under the header. */
export function isCandidatePath(rawPath: string | null | undefined): boolean {
  const p = clean(rawPath);
  return (
    p === "/for-candidates" ||
    p.startsWith("/for-candidates/") ||
    p === "/jobs" ||
    p.startsWith("/jobs/") ||
    p.startsWith("/stilling/") ||
    p === "/premium" ||
    p.startsWith("/premium/")
  );
}

/** Which tab of the candidate row is the page the visitor is on. */
export function activeCandidateTab(rawPath: string | null | undefined, _search = ""): string | null {
  const p = clean(rawPath);
  if (p === "/jobs" || p.startsWith("/jobs/") || p.startsWith("/stilling/")) return SITE_PATHS.jobs;
  if (p === "/premium" || p.startsWith("/premium/")) return SITE_PATHS.lifeInNorway;
  if (p === "/for-candidates/questions") return SITE_PATHS.questions;
  if (p === "/for-candidates/support") return SITE_PATHS.support;
  if (p === "/for-candidates") return SITE_PATHS.candidates;
  return null;
}

/** The language of the page's own copy, which the shell follows: menus, cookie bar, footer. */
export function siteLang(rawPath: string | null | undefined): SiteLang {
  return langForPath(rawPath) === "nb" ? "no" : "en";
}

export type PageAction =
  | { kind: "link"; href: string; label: string; rask?: boolean }
  | { kind: "sheet"; sheet: string; label: string };

/** The one action a page's header offers on the right, as in the mockup. The front page has none. */
export function pageAction(rawPath: string | null | undefined): PageAction | null {
  const p = clean(rawPath);
  if (p === "/for-employers") return { kind: "link", href: SITE_PATHS.request, label: "Be om kandidater", rask: true };
  if (p === "/prosjekter") return { kind: "link", href: SITE_PATHS.forsprangAccess, label: "Be om invitasjon" };
  if (p === "/for-candidates" || p === "/for-candidates/questions" || p === "/premium" || p.startsWith("/premium/")) {
    return { kind: "link", href: SITE_PATHS.jobs, label: "View open jobs" };
  }
  if (p === "/about") return { kind: "link", href: SITE_PATHS.contact, label: "Contact us" };
  return null;
}

/** Pages that keep a header of their own and never show the site's shell. */
export function hasOwnShell(rawPath: string | null | undefined): boolean {
  const p = clean(rawPath);
  if (p.startsWith("/flislegger")) return true;
  if (p === "/beta") return true;
  // ORDER 273: Min side is the client's own app and carries its own header.
  if (/^\/min-side\/[0-9a-f-]{36}/i.test(p)) return true;
  return false;
}

/**
 * Pages without the site footer: the shells of their own, the admin, and the
 * signed-in or one-person screens this order leaves as they are (a client's
 * project page, Min side, the CV and register flows, the request wizard).
 */
export function hidesFooter(rawPath: string | null | undefined): boolean {
  const p = clean(rawPath);
  if (hasOwnShell(p)) return true;
  if (p.startsWith("/admin")) return true;
  if (p === "/min-side" || p.startsWith("/min-side/")) return true;
  if (/^\/prosjekt(er)?\/[^/]+/.test(p)) return true;
  if (p === "/cv" || p.startsWith("/cv/") || p === "/register" || p.startsWith("/register/")) return true;
  if (p.startsWith("/request/") || p.startsWith("/verified")) return true;
  return false;
}
