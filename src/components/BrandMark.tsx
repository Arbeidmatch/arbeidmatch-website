import type { MouseEventHandler } from "react";
import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  className?: string;
  logoSize?: number;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function BrandMark({ href = "/", className = "", logoSize = 34, onClick }: BrandMarkProps) {
  return (
    <Link
      href={href}
      aria-label="ArbeidMatch home"
      className={`flex min-h-[44px] min-w-0 shrink-0 items-center gap-2.5 whitespace-nowrap text-inherit no-underline ${className}`}
      onClick={onClick}
    >
      <Image
        src="/brand/arbeidmatch-a-emblem.png"
        alt=""
        width={logoSize}
        height={logoSize}
        className="shrink-0 object-contain"
        priority
      />
      <span className="shrink-0 text-[1.25rem] font-bold leading-none tracking-tight text-[#C9A84C]" style={{ fontWeight: 700 }}>
        ArbeidMatch
      </span>
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[4px] bg-[#C9A84C] px-[6px] py-[2px] text-[10px] font-semibold uppercase leading-none tracking-[0.05em] text-[#0D1B2A]"
        aria-hidden
      >
        BETA
      </span>
    </Link>
  );
}
