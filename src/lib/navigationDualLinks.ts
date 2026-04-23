import type { NavigationUserType } from "@/lib/navigationUserType";

export type DualNavLink = { href: string; label: string; external?: boolean };

/** Desktop center row (max 4) — employer */
export const premiumEmployerCenter: DualNavLink[] = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/become-a-partner", label: "Become a Partner" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

/** Desktop “More” dropdown — employer */
export const premiumEmployerMore: DualNavLink[] = [
  { href: "/for-staffing-agencies", label: "For Staffing Agencies" },
  { href: "/employer/invoices", label: "Invoices" },
  { href: "/pricing", label: "Pricing" },
  { href: "/welding-specialists", label: "Welding Specialists" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/partners", label: "Trusted Partners" },
  { href: "/faq", label: "FAQ" },
];

/** Desktop center row — candidate */
export const premiumCandidateCenter: DualNavLink[] = [
  { href: "/for-candidates", label: "For Candidates" },
  { href: "https://jobs.arbeidmatch.no", label: "Browse Jobs", external: true },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

/** Desktop “More” dropdown — candidate */
export const premiumCandidateMore: DualNavLink[] = [
  { href: "/candidates", label: "Create Profile" },
  { href: "/pricing", label: "Pricing" },
  { href: "/non-eu-candidates", label: "Outside EU/EEA" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/partners", label: "Trusted Partners" },
  { href: "/faq", label: "FAQ" },
];

/** Full lists for mobile drawer (center + more). */
export const employerNavLinks: DualNavLink[] = [...premiumEmployerCenter, ...premiumEmployerMore];

export const candidateNavLinks: DualNavLink[] = [...premiumCandidateCenter, ...premiumCandidateMore];

export const neutralNavLinks: {
  href: string;
  label: string;
  userType?: NavigationUserType;
}[] = [
  { href: "/for-employers", label: "For Employers", userType: "employer" },
  { href: "/for-candidates", label: "For Candidates", userType: "candidate" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];
