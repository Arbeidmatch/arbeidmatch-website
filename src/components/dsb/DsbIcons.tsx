"use client";

import { forwardRef, type SVGProps } from "react";

const base = "dsb-decor-shelf-icon shrink-0";

type IconProps = SVGProps<SVGSVGElement> & { "aria-hidden"?: boolean };

function wrap(
  displayName: string,
  paths: React.ReactNode,
  viewBox = "0 0 24 24",
) {
  const C = forwardRef<SVGSVGElement, IconProps>(function DsbIcon(props, ref) {
    const { className, ...rest } = props;
    return (
      <svg
        ref={ref}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-5 w-5 ${base} ${className ?? ""}`}
        aria-hidden
        {...rest}
      >
        {paths}
      </svg>
    );
  });
  C.displayName = displayName;
  return C;
}

export const IconLightning = wrap(
  "IconLightning",
  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" vectorEffect="non-scaling-stroke" />,
);

export const IconDocument = wrap(
  "IconDocument",
  <>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
    <path d="M14 2v6h6M8 13h8M8 17h6" />
  </>,
);

export const IconLink = wrap(
  "IconLink",
  <>
    <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
    <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
  </>,
);

export const IconClock = wrap(
  "IconClock",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);

export const IconShield = wrap(
  "IconShield",
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
);

export const IconGlobe = wrap(
  "IconGlobe",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 0 0 18M12 3a14 14 0 0 1 0 18" />
  </>,
);

export const IconCheckCircle = wrap(
  "IconCheckCircle",
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.2 2.2L15.5 9" />
  </>,
);

export const IconTranslate = wrap(
  "IconTranslate",
  <>
    <rect x="2" y="5" width="10" height="7" rx="1.5" />
    <path d="M4.5 8h5M4.5 10h3.5" />
    <rect x="12" y="12" width="10" height="7" rx="1.5" />
    <path d="M14.5 15h5M14.5 17h3.5" />
  </>,
);

export const IconAirplane = wrap(
  "IconAirplane",
  <path d="M10.5 19 21 3l-2.2 9.8L13 14l-7 3 1-6.5L3 10.5 21 3" />,
);

export const IconGraph = wrap(
  "IconGraph",
  <>
    <path d="M4 19V5M4 19h16" />
    <path d="M8 15v-4M12 15V8M16 15v-6M20 15v-9" />
  </>,
);

export const IconScale = wrap(
  "IconScale",
  <>
    <path d="M12 3v18" />
    <path d="M6 7h-3v6h3l2-3-2-3zM18 7h3v6h-3l-2-3 2-3z" />
    <path d="M6 13h12" />
  </>,
);

export const IconLock = wrap(
  "IconLock",
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
);

export const IconMail = wrap(
  "IconMail",
  <>
    <path d="M4 6h16v12H4z" />
    <path d="m4 6 8 6 8-6" />
  </>,
);

export type DsbGuideDecorIconName =
  | "lightning"
  | "document"
  | "link"
  | "clock"
  | "shield"
  | "globe"
  | "check"
  | "translate"
  | "airplane"
  | "graph"
  | "scale";

const MAP: Record<DsbGuideDecorIconName, React.ComponentType<IconProps>> = {
  lightning: IconLightning,
  document: IconDocument,
  link: IconLink,
  clock: IconClock,
  shield: IconShield,
  globe: IconGlobe,
  check: IconCheckCircle,
  translate: IconTranslate,
  airplane: IconAirplane,
  graph: IconGraph,
  scale: IconScale,
};

export function DsbGuideDecorIcon({ name, className }: { name: DsbGuideDecorIconName; className?: string }) {
  const Cmp = MAP[name];
  return <Cmp className={className} />;
}

/** Animated list check (circle + check) - stroke controlled by parent via CSS var or class */
export function IconListCheckDrawn({ drawn, className }: { drawn: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      className={`dsb-list-check-svg ${drawn ? "is-drawn" : ""} ${className ?? ""}`}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        className="dsb-list-check-circle-ring"
      />
      <path
        d="M8 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dsb-list-check-path"
        pathLength={1}
      />
    </svg>
  );
}
