import type { Metadata } from "next";
import type { ReactNode } from "react";

import Toast from "@/components/ui/Toast";
import { ToastProvider } from "@/lib/toast-context";

export const metadata: Metadata = {
  // The root layout appends "| ArbeidMatch" through title.template, so the suffix is left out here.
  title: "Be om kandidater",
  description:
    "Velg bransje og rolle, så finner vi kvalifiserte kandidater til bedriften deres. Start en kandidatforespørsel hos ArbeidMatch.",
  robots: { index: false, follow: false },
};

export default function RequestLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toast />
    </ToastProvider>
  );
}
