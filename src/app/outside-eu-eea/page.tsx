import type { Metadata } from "next";
import OutsideEuEeaClient from "./OutsideEuEeaClient";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/outside-eu-eea",
  "Working in Norway from outside the EU/EEA | ArbeidMatch",
  "Context on permits and practical steps for skilled workers outside the EU/EEA. ArbeidMatch does not offer job placements for this group; guides explain requirements and process.",
);

export default function OutsideEuEeaPage() {
  return <OutsideEuEeaClient />;
}
