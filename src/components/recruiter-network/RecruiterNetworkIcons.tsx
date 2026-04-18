"use client";

import type { ReactNode } from "react";
import { useId } from "react";

function GoldStroke({ children, size }: { children: ReactNode; size: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="rn-draw shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#g-${id})`} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

export function IconMegaphone({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <path d="M6 14v8l4 2V12L6 14z" />
      <path d="M10 12l10-4v20l-10-4" />
      <path d="M22 10c3 1 5 3 5 8s-2 7-5 8" />
      <path d="M24 8c4 2 6 5 6 10s-2 8-6 10" />
      <path d="M26 6c5 2 8 6 8 12s-3 10-8 12" />
    </GoldStroke>
  );
}

export function IconNetworkPeople({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <circle cx="11" cy="14" r="3.5" />
      <path d="M7 24c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5" />
      <circle cx="25" cy="14" r="3.5" />
      <path d="M21 24c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5" />
      <circle cx="18" cy="20" r="2" />
      <line x1="14.5" y1="16" x2="16.5" y2="18.5" />
      <line x1="21.5" y1="16" x2="19.5" y2="18.5" />
    </GoldStroke>
  );
}

export function IconBookUp({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <path d="M10 8h7v20H10c-1.5 0-3-1-3-3V11c0-1.5 1.5-3 3-3z" />
      <path d="M19 8h7c1.5 0 3 1.5 3 3v14c0 2-1.5 3-3 3h-7" />
      <path d="M18 26V8" />
      <path d="M18 6l-3-2v6l3-2 3 2V4l-3 2z" />
    </GoldStroke>
  );
}

export function IconMapCoverage({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <circle cx="18" cy="16" r="9" />
      <path d="M18 7v3M18 22v3M9 16h3M24 16h3M11.5 10.5l2 2M22.5 21.5l2 2M25.5 10.5l-2 2M13.5 21.5l-2 2" />
      <circle cx="18" cy="16" r="2" fill="none" />
    </GoldStroke>
  );
}

export function IconLayers({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <path d="M6 14l12 6 12-6-12-6-12 6z" />
      <path d="M6 20l12 6 12-6" />
      <path d="M6 26l12 6 12-6" />
      <path d="M18 20v12M10 16l2 1M24 17l2-1" />
    </GoldStroke>
  );
}

export function IconVenn({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <circle cx="14" cy="18" r="7" />
      <circle cx="22" cy="18" r="7" />
      <circle cx="18" cy="18" r="1.5" fill="none" />
    </GoldStroke>
  );
}

export function IconTrend({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <polyline points="6,24 12,18 17,20 24,12 30,8" />
      <circle cx="30" cy="8" r="2.5" />
      <path d="M6 28h24" />
    </GoldStroke>
  );
}

export function IconDocCheck({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <path d="M12 6h10l4 4v18a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M22 6v4h4" />
      <path d="M14 20l3 3 6-6" />
    </GoldStroke>
  );
}

export function IconMonitor({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <rect x="6" y="8" width="24" height="16" rx="2" />
      <path d="M12 12h12v8H12z" />
      <path d="M14 22l2 2M22 24l-2-2" />
      <path d="M14 10h4M22 10h2" />
      <path d="M14 26h8" />
    </GoldStroke>
  );
}

export function IconPeopleArrow({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <circle cx="11" cy="14" r="3" />
      <path d="M7 23c0-2 1.5-3.5 4-3.5" />
      <circle cx="25" cy="14" r="3" />
      <path d="M21 23c0-2 1.5-3.5 4-3.5" />
      <path d="M17 16h6M22 16l-1.5-1.5M22 16l-1.5 1.5" />
    </GoldStroke>
  );
}

export function IconHandshake({ size = 36 }: { size?: number }) {
  return (
    <GoldStroke size={size}>
      <path d="M8 20c2-4 5-6 8-6l2 4-3 5-4-1-3-2z" />
      <path d="M28 20c-2-4-5-6-8-6l-2 4 3 5 4-1 3-2z" />
      <path d="M14 18l8 2" />
    </GoldStroke>
  );
}

export function IconCheckCircle({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const svgClass = ["rn-draw", className].filter(Boolean).join(" ");
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      className={svgClass}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ filter: "drop-shadow(0 0 6px rgba(184,134,11,0.35))" }}
    >
      <defs>
        <linearGradient id={`gc-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="22" fill="none" stroke={`url(#gc-${id})`} strokeWidth="2" className="origin-center" />
      <path
        d="M18 28l7 7 14-14"
        fill="none"
        stroke={`url(#gc-${id})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="origin-center"
      />
    </svg>
  );
}
