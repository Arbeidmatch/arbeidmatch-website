"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { ToastType, useToastState } from "@/lib/toast-context";

const toneClasses: Record<ToastType, string> = {
  success: "text-emerald-300",
  error: "text-red-300",
  info: "text-blue-300",
};

function ToneIcon({ type }: { type: ToastType }) {
  if (type === "success") return <CheckCircle2 className={`h-5 w-5 ${toneClasses.success}`} aria-hidden />;
  if (type === "error") return <AlertCircle className={`h-5 w-5 ${toneClasses.error}`} aria-hidden />;
  return <Info className={`h-5 w-5 ${toneClasses.info}`} aria-hidden />;
}

export default function Toast() {
  const { toasts, dismissToast } = useToastState();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex w-[min(92vw,360px)] flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-[#0D1B2A] p-4 text-sm text-white"
            role="status"
            aria-live="polite"
          >
            <ToneIcon type={toast.type} />
            <p className="flex-1 leading-relaxed text-white">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-md p-1 text-white/60 transition-colors hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
