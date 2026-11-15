"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Icon } from "@/components/site/Icon";
import type { SiteLang } from "@/components/site/siteNav";

/**
 * The glass sheet every form of the site rises in (ORDER 295): a title bar
 * with close and, in a sub-panel, back; the main panel, which slides aside
 * when a navigation row opens its sub-panel; and a footer with the one action
 * and its note. Escape steps back from a sub-panel, then closes.
 */
export function SheetFrame({
  open,
  lang,
  title,
  sub,
  onBack,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  lang: SiteLang;
  title: string;
  sub: { title: string; content: ReactNode } | null;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const el = sheetRef.current?.querySelector<HTMLElement>(".sh-p.main input, .sh-p.main textarea, .sh-p.main button, .sh-p.main a, [data-close]");
      el?.focus({ preventScroll: true });
    }, 60);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      const opener = openerRef.current;
      if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (sub) onBack();
        else onClose();
        return;
      }
      if (e.key !== "Tab" || !sheetRef.current) return;
      // Keep the keyboard inside the sheet while it is open.
      const items = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex='-1'])"),
      ).filter((el) => el.offsetParent !== null && !el.closest("[inert]"));
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, sub, onBack, onClose]);

  const close = lang === "no" ? "Lukk" : "Close";
  const back = lang === "no" ? "Tilbake" : "Back";

  return (
    <div className={`ams sheet-host${open ? " has-sheet" : ""}`} lang={lang === "no" ? "nb" : "en"} inert={!open}>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <section ref={sheetRef} className={`sheet${sub ? " insub" : ""}`} role="dialog" aria-modal="true" aria-labelledby="am-sheet-title">
        <div className="grab" />
        <header className="sh-bar">
          {sub ? (
            <button type="button" className="rb" onClick={onBack} aria-label={back}>
              <Icon name="back" />
            </button>
          ) : (
            <span />
          )}
          <h3 id="am-sheet-title">{sub ? sub.title : title}</h3>
          <button type="button" className="rb" data-close onClick={onClose} aria-label={close}>
            <Icon name="x" />
          </button>
        </header>
        <div className="sh-panels">
          <div className="sh-p main" inert={!!sub}>
            {children}
          </div>
          <div className="sh-p subp" inert={!sub}>
            {sub?.content}
          </div>
        </div>
        {footer && !sub ? <footer className="sh-foot">{footer}</footer> : null}
      </section>
    </div>
  );
}
