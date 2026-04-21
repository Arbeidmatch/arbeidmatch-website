import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Request Candidates | ArbeidMatch",
  description:
    "Submit your staffing request and get pre-screened EU/EEA candidates for your Norwegian business.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RequestTokenLayout({ children }: { children: ReactNode }) {
  return children;
}
