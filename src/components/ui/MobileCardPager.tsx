"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type MobileCardPagerProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  getKey: (item: T, index: number) => string;
  pageSize?: number;
  desktopClassName?: string;
  mobileClassName?: string;
  dotsClassName?: string;
};

export default function MobileCardPager<T>({
  items,
  renderItem,
  getKey,
  pageSize = 4,
  desktopClassName = "space-y-2",
  mobileClassName = "space-y-2 px-3",
  dotsClassName = "mt-3",
}: MobileCardPagerProps<T>) {
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const pages = useMemo(() => {
    if (!isMobile || items.length <= pageSize) return [items];
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += pageSize) out.push(items.slice(i, i + pageSize));
    return out;
  }, [isMobile, items, pageSize]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, Math.max(0, pages.length - 1)));
  }, [pages.length]);

  if (!isMobile || items.length <= pageSize) {
    return <div className={desktopClassName}>{items.map((item, index) => <div key={getKey(item, index)}>{renderItem(item, index)}</div>)}</div>;
  }

  const activeItems = pages[page] ?? [];

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`page-${page}`}
          custom={direction}
          initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60 && page < pages.length - 1) {
              setDirection(1);
              setPage((p) => p + 1);
            } else if (info.offset.x > 60 && page > 0) {
              setDirection(-1);
              setPage((p) => p - 1);
            }
          }}
          className={mobileClassName}
        >
          {activeItems.map((item, index) => {
            const absoluteIndex = page * pageSize + index;
            return <div key={getKey(item, absoluteIndex)}>{renderItem(item, absoluteIndex)}</div>;
          })}
        </motion.div>
      </AnimatePresence>

      <div className={`flex items-center justify-center gap-2 ${dotsClassName}`}>
        {pages.map((_, idx) => (
          <button
            key={`dot-${idx}`}
            type="button"
            aria-label={`Go to page ${idx + 1}`}
            onClick={() => {
              setDirection(idx > page ? 1 : -1);
              setPage(idx);
            }}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${idx === page ? "bg-[#C9A84C]" : "bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
}

