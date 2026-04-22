import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DSB assistance notifications | ArbeidMatch",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DsbAssistanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
