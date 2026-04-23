import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "DSB Information: Non-EU Electricians",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DsbGuideNonEuPage() {
  redirect("/electricians-norway?section=dsb");
}
