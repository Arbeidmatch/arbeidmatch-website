import type { NavigationUserType } from "@/lib/navigationUserType";

export type DualNavLink = { href: string; label: string; external?: boolean };

export const employerNavLinks: DualNavLink[] = [
  { href: "/request", label: "Request Candidates" },
  { href: "/become-a-partner", label: "Become a Partner" },
  { href: "/welding-specialists", label: "Welding Specialists" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/partners", label: "Trusted Partners" },
  { href: "/about", label: "Om oss" },
  { href: "/contact", label: "Contact" },
];

export const candidateNavLinks: DualNavLink[] = [
  { href: "/for-candidates", label: "For Candidates" },
  { href: "https://jobs.arbeidmatch.no", label: "Browse Jobs", external: true },
  { href: "/candidates", label: "Create Profile" },
  { href: "/non-eu-candidates", label: "Non-EU Workers" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/partners", label: "Trusted Partners" },
  { href: "/about", label: "Om oss" },
  { href: "/contact", label: "Contact" },
];

export const neutralNavLinks: {
  href: string;
  label: string;
  /** Persist userType then navigate */
  userType?: NavigationUserType;
}[] = [
  { href: "/for-employers", label: "For Employers", userType: "employer" },
  { href: "/for-candidates", label: "For Candidates", userType: "candidate" },
  { href: "/about", label: "Om oss" },
  { href: "/contact", label: "Contact" },
];
