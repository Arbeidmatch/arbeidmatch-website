"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type PremiumDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
};

export default function PremiumDropdown({ value, onChange, options, placeholder = "Select", className = "" }: PremiumDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => options.find((option) => option.value === value)?.label ?? placeholder, [options, placeholder, value]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current) return;
      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0D1B2A] px-4 py-3 text-left text-sm text-white transition-[border,box-shadow] duration-200 hover:border-white/30 focus:border-[#C9A84C]/60 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.14)] focus:outline-none"
      >
        <span className={value ? "text-white" : "text-white/55"}>{selectedLabel}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-[#C9A84C]" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0D1B2A] shadow-[0_14px_32px_rgba(0,0,0,0.35)]"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    active ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "text-white/80 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
