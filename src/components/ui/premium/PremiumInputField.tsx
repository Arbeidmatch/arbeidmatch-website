"use client";

import { motion } from "framer-motion";
import { useId } from "react";

type BaseProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
};

type PremiumInputFieldProps = BaseProps & {
  multiline?: false;
};

type PremiumTextareaFieldProps = BaseProps & {
  multiline: true;
  rows?: number;
};

export default function PremiumInputField(props: PremiumInputFieldProps | PremiumTextareaFieldProps) {
  const id = useId();
  const isActive = props.value.trim().length > 0;
  const containerClass = `relative rounded-xl border bg-white/5 px-4 pt-5 pb-2 transition-[border,box-shadow] duration-200 ${
    props.disabled ? "border-white/10 opacity-70" : "border-white/10 focus-within:border-[#C9A84C]/60 focus-within:shadow-[0_0_0_3px_rgba(201,168,76,0.14)]"
  } ${props.className || ""}`;

  return (
    <div className={containerClass}>
      {props.multiline ? (
        <textarea
          id={id}
          value={props.value}
          rows={props.rows ?? 4}
          disabled={props.disabled}
          placeholder={props.placeholder || " "}
          onChange={(e) => props.onChange(e.target.value)}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-transparent"
        />
      ) : (
        <input
          id={id}
          type={props.type || "text"}
          value={props.value}
          disabled={props.disabled}
          placeholder={props.placeholder || " "}
          onChange={(e) => props.onChange(e.target.value)}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-transparent"
        />
      )}
      <motion.label
        htmlFor={id}
        initial={false}
        animate={{
          y: isActive ? -12 : 0,
          scale: isActive ? 0.88 : 1,
          color: isActive ? "rgba(201,168,76,0.95)" : "rgba(255,255,255,0.62)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 24, duration: 0.2 }}
        className="pointer-events-none absolute left-4 top-3 origin-left text-xs"
      >
        {props.label}
      </motion.label>
    </div>
  );
}
