"use client";

import { useId } from "react";
import { looksLikeNationalId } from "@/lib/cv/schema";

const inputClass =
  "w-full rounded border border-[#E2E5EA] bg-white px-3 py-2.5 text-[15px] text-[#0D1B2A] outline-none transition-colors placeholder:text-[#8A929C] focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/40";

interface BaseProps {
  label: string;
  help?: string;
  example?: string;
  error?: string;
  required?: boolean;
}

function FieldShell({
  id,
  label,
  help,
  example,
  error,
  required,
  children,
}: BaseProps & { id: string; children: React.ReactNode }) {
  const describedBy = [help || example ? `${id}-help` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    // Flex column with the control pushed down, so inputs sitting side by side line up
    // even when their helper text runs to a different number of lines.
    <div className="mb-4 flex h-full flex-col">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-[#0D1B2A]">
        {label}
        {required ? <span className="ml-1 text-[#B03A2E]">*</span> : null}
      </label>
      {help || example ? (
        <p id={`${id}-help`} className="mb-1.5 text-[13px] leading-snug text-[#55616D]">
          {help}
          {example ? <span className="block text-[#8A929C]">Example: {example}</span> : null}
        </p>
      ) : null}
      <div className="mt-auto" aria-describedby={describedBy || undefined}>
        {children}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[13px] font-medium text-[#B03A2E]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  spellCheck = false,
  ...rest
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  /** On for fields holding English words, off for names, emails and numbers. */
  spellCheck?: boolean;
}) {
  const id = useId();
  const idWarning = type !== "email" && looksLikeNationalId(value);

  return (
    <FieldShell id={id} {...rest}>
      <input
        id={id}
        type={type}
        className={inputClass}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        spellCheck={spellCheck}
        lang={spellCheck ? "en" : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {idWarning ? (
        <p className="mt-1 text-[13px] font-medium text-[#B26A00]" aria-live="polite">
          Do not include your national identity number in a CV.
        </p>
      ) : null}
    </FieldShell>
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  maxLength,
  counter,
  ...rest
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  counter?: boolean;
}) {
  const id = useId();
  const idWarning = looksLikeNationalId(value);

  return (
    <FieldShell id={id} {...rest}>
      {/*
        The page is lang="nb", so without lang="en" here the browser checks English CV text
        against a Norwegian dictionary and underlines every word. With it, the candidate gets
        their own operating system's English spell checker: red underline, right click to fix.
        The basic checker runs on the device, so nothing is sent anywhere before consent.
      */}
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        className={`${inputClass} resize-y`}
        value={value}
        spellCheck
        lang="en"
        onChange={(event) => onChange(event.target.value)}
      />
      {counter ? (
        <p className="mt-1 text-right text-[12px] text-[#8A929C]" aria-live="polite">
          {value.trim().length} characters
        </p>
      ) : null}
      {idWarning ? (
        <p className="mt-1 text-[13px] font-medium text-[#B26A00]" aria-live="polite">
          Do not include your national identity number in a CV.
        </p>
      ) : null}
    </FieldShell>
  );
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  ...rest
}: BaseProps & {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  const id = useId();
  return (
    <FieldShell id={id} {...rest}>
      <select
        id={id}
        className={inputClass}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxGroup<T extends string>({
  legend,
  values,
  options,
  onToggle,
  help,
}: {
  legend: string;
  values: T[];
  options: readonly T[];
  onToggle: (value: T) => void;
  help?: string;
}) {
  return (
    <fieldset className="mb-4">
      <legend className="mb-1 text-sm font-semibold text-[#0D1B2A]">{legend}</legend>
      {help ? <p className="mb-2 text-[13px] text-[#55616D]">{help}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = values.includes(option);
          return (
            <label
              key={option}
              className={`cursor-pointer rounded border px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#C9A84C] ${
                checked
                  ? "border-[#C9A84C] bg-[#C9A84C]/15 font-semibold text-[#0D1B2A]"
                  : "border-[#E2E5EA] bg-white text-[#55616D]"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onToggle(option)}
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export const fieldInputClass = inputClass;
