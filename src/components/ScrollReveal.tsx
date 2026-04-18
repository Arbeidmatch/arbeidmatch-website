"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { EASE_PREMIUM, getRevealDurationMs, getRevealTranslateY } from "@/lib/animationConstants";
import type { ScrollRevealVariant } from "@/hooks/useScrollReveal";

type Props = {
  children: React.ReactNode;
  variant?: ScrollRevealVariant;
  className?: string;
};

function useIsMobileWidth(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const fn = () => setM(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return m;
}

export default function ScrollReveal({ children, variant = "fadeUp", className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileWidth();
  const reduceMotion = useReducedMotion();
  const amount = isMobile ? 0.05 : 0.1;
  const isInView = useInView(ref, { once: true, amount, margin: "0px 0px -6% 0px" });

  const y = getRevealTranslateY(isMobile);
  const duration = getRevealDurationMs(isMobile) / 1000;

  const variants = useMemo(() => {
    switch (variant) {
      case "fadeIn":
        return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
      case "fadeLeft":
        return { hidden: { opacity: 0, x: -y }, visible: { opacity: 1, x: 0 } };
      case "fadeRight":
        return { hidden: { opacity: 0, x: y }, visible: { opacity: 1, x: 0 } };
      case "scaleIn":
        return {
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        };
      case "fadeUp":
      default:
        return { hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0 } };
    }
  }, [variant, y]);

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration,
        ease: EASE_PREMIUM,
      }}
      style={{ willChange: isInView ? "auto" : "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

type GridProps<T> = {
  className?: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemKey: (item: T, index: number) => string | number;
};

export function ScrollRevealGrid<T>({ className, items, renderItem, itemKey }: GridProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileWidth();
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: isMobile ? 0.05 : 0.1 });
  const stagger = (isMobile ? 40 : 80) / 1000;
  const duration = getRevealDurationMs(isMobile) / 1000;
  const y = getRevealTranslateY(isMobile);

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {items.map((item, i) => (
          <span key={String(itemKey(item, i))}>{renderItem(item, i)}</span>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={String(itemKey(item, i))}
          variants={{
            hidden: { opacity: 0, y },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration, ease: EASE_PREMIUM },
            },
          }}
        >
          {renderItem(item, i)}
        </motion.div>
      ))}
    </motion.div>
  );
}
