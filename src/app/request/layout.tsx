import type { ReactNode } from "react";

import Toast from "@/components/ui/Toast";
import { ToastProvider } from "@/lib/toast-context";

export default function RequestLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <Toast />
    </ToastProvider>
  );
}
