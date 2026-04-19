export interface SourceDisclaimerProps {
  text: string;
  sourceLabel: string;
  sourceUrl: string;
  /** Default: muted on white. Use "dark" on navy/dark cards. */
  variant?: "light" | "dark";
  /** Optional classes for the paragraph (e.g. text size on compact cards). */
  className?: string;
}

export default function SourceDisclaimer({
  text,
  sourceLabel,
  sourceUrl,
  variant = "light",
  className = "",
}: SourceDisclaimerProps) {
  const textCls =
    variant === "dark" ? "italic text-white/[0.45]" : "italic text-[#6b7280]";
  const sizeCls = variant === "dark" ? "text-[11px]" : "text-[13px]";
  return (
    <p className={`mt-2 leading-[1.5] ${sizeCls} ${textCls} ${className}`.trim()}>
      {text}{" "}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] font-medium text-[#C9A84C] underline underline-offset-2 hover:text-[#b8953f]"
      >
        {sourceLabel}
      </a>
    </p>
  );
}
