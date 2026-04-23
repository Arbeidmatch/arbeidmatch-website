import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "DSB Information: EU/EEA Electricians",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DsbGuideEuPage() {
  redirect("/electricians-norway?section=dsb");
}
