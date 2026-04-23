import type { Metadata } from "next";
import StaffingAgenciesPage from "@/components/staffing-agencies/StaffingAgenciesPage";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/for-staffing-agencies",
  "For Staffing Agencies | ArbeidMatch Partner Sourcing",
  "Scale your recruitment with ArbeidMatch. We source and pre-screen EU/EEA candidates so your team can focus on clients, interviews, and placements.",
);

export default function ForStaffingAgenciesRoute() {
  return <StaffingAgenciesPage />;
}
