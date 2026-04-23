"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type PremiumChoiceCardProps = {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  type?: "radio" | "checkbox";
  className?: string;
};

export default function PremiumChoiceCard({
  selected,
  onClick,
  title,
  description,
  icon,
  type = "checkbox",
  className = "",
}: PremiumChoiceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, duration: 0.2 }}
      className={`relative w-full rounded-xl border p-4 text-left transition-[border,background,filter] duration-200 ${
        selected
          ? "border-[#C9A84C] bg-[#C9A84C]/10 text-white filter drop-shadow-[0_0_8px_rgba(201,168,76,0.3)]"
          : "border-white/10 bg-white/[0.03] text-white/85 hover:border-white/30"
      } ${className}`}
      aria-pressed={selected}
      data-choice-type={type}
    >
      {selected ? (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 18, duration: 0.2 }}
          className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A84C] text-[#0D1B2A]"
        >
          <Check className="h-3.5 w-3.5" />
        </motion.span>
      ) : null}
      <span className="flex items-start gap-3">
        {icon ? <span className="mt-0.5 shrink-0 text-[#C9A84C]">{icon}</span> : null}
        <span className="block">
          <span className="block text-sm font-semibold">{title}</span>
          {description ? <span className="mt-1 block text-xs text-white/65">{description}</span> : null}
        </span>
      </span>
    </motion.button>
  );
}
