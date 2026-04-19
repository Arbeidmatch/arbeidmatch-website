import type { LucideIcon } from "lucide-react";
import { Award, Clock, Globe, Layers, Settings, ShieldCheck, Users, Zap } from "lucide-react";

export type WeldingCertItem = {
  Icon: LucideIcon;
  title: string;
  body: string;
};

export const WELDING_CERT_ITEMS: WeldingCertItem[] = [
  {
    Icon: Award,
    title: "ISO 9606 Welder Qualification",
    body: "Certified welders qualified to ISO 9606-1 for fusion welding of steels. Valid across EU/EEA project sites and Norwegian industrial facilities.",
  },
  {
    Icon: Layers,
    title: "EN 287 and EN ISO Standards",
    body: "Specialists certified to European welding standards for structural steel, pipelines, pressure vessels, and offshore components.",
  },
  {
    Icon: ShieldCheck,
    title: "Offshore and Maritime Welding",
    body: "Welders with NORSOK and DNV certification experience for offshore structures, vessels, and subsea equipment in the Norwegian sector.",
  },
  {
    Icon: Settings,
    title: "Specialized Authorizations",
    body: "Technicians holding sector-specific authorizations: NDT operators, welding inspectors, coded welders for pressure equipment (PED), and structural welding supervisors.",
  },
  {
    Icon: Zap,
    title: "Industrial and Process Welding",
    body: "MIG, MAG, TIG, FCAW, and SAW process specialists for heavy industry, manufacturing, chemical plants, and energy infrastructure across Norway.",
  },
  {
    Icon: Globe,
    title: "EU/EEA Sourcing Network",
    body: "We recruit from 30 EU/EEA countries with established networks in Poland, Romania, Czech Republic, Slovakia, and the Baltic states where ISO-certified welding talent is concentrated.",
  },
  {
    Icon: Clock,
    title: "Certificate Validity Verification",
    body: "Every candidate we present has their ISO and EN certificates verified for validity before presentation. We check renewal status and expiry dates as part of screening. Employers should conduct their own verification before onboarding.",
  },
  {
    Icon: Users,
    title: "Staffing and Direct Hire",
    body: "Available for temporary staffing, project-based contracts, and permanent direct hire. We adapt to your project timeline and employment structure.",
  },
];
