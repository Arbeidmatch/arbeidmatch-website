import type { NavigationUserType } from "@/lib/navigationUserType";

export type DualNavLink = { href: string; label: string; external?: boolean };

/** Main top-level desktop navigation. */
export const premiumEmployerCenter: DualNavLink[] = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

/** Mega menu column: Solutions */
export const employerMegaSolutions: DualNavLink[] = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/for-staffing-agencies", label: "For Staffing Agencies" },
  { href: "/recruiter-network", label: "Recruiter Network" },
];

/** Mega menu column: Resources */
export const employerMegaResources: DualNavLink[] = [
  { href: "/faq", label: "FAQ" },
  { href: "/welding-specialists", label: "Welding Specialists" },
  { href: "/electricians-norway", label: "Electricians Norway" },
];

/** Candidate desktop row kept for compatibility in other UIs. */
export const premiumCandidateCenter: DualNavLink[] = [
  { href: "/for-candidates", label: "For Candidates" },
  { href: "https://jobs.arbeidmatch.no", label: "Browse Jobs", external: true },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

/** "More" dropdown removed from premium navbar. */
export const premiumEmployerMore: DualNavLink[] = [];
export const premiumCandidateMore: DualNavLink[] = [];

/** Full lists for mobile drawer (center + more). */
export const employerNavLinks: DualNavLink[] = [...premiumEmployerCenter, ...premiumEmployerMore];

export const candidateNavLinks: DualNavLink[] = [...premiumCandidateCenter, ...premiumCandidateMore];

export const neutralNavLinks: {
  href: string;
  label: string;
  userType?: NavigationUserType;
}[] = [
  { href: "/for-employers", label: "For Employers", userType: "employer" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];
