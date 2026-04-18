"use client";

import { useEffect, useRef, useState } from "react";

export type ScrollRevealVariant = "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" | "scaleIn";

export type UseScrollRevealOptions = {
  variant?: ScrollRevealVariant;
  /** Default 0.1 desktop; 0.05 mobile when passed from component */
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

const defaultThreshold = 0.1;

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  variant: _variant,
  threshold = defaultThreshold,
  rootMargin = "0px 0px -5% 0px",
  once = true,
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}
