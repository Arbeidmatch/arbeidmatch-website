"use client";

import { useId, useState, type ReactNode } from "react";

import { Icon } from "@/components/site/Icon";

/**
 * The numbered accordion of the mockup (ORDER 295): one item open at a time,
 * the first open on arrival; a heading button with its number and a plus that
 * turns into a cross.
 */
export function Accordion({ items, numbered = true }: { items: readonly { title: string; body: ReactNode }[]; numbered?: boolean }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <div className="acc">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title} className={`acc-i${isOpen ? " open" : ""}`}>
            <button type="button" className="acc-h" aria-expanded={isOpen} aria-controls={`${base}-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
              {numbered ? <b>{i + 1}</b> : null}
              {item.title}
              <span className="pm">
                <Icon name="plus" />
              </span>
            </button>
            <div className="acc-b" id={`${base}-${i}`} role="region">
              {item.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
