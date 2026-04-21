import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "DSB Authorization Assistance | ArbeidMatch",
  description:
    "Get help with your DSB authorization process in Norway. ArbeidMatch guides EU/EEA electricians through every step.",
};

export default function DsbAssistanceLayout({ children }: { children: ReactNode }) {
  return children;
}
