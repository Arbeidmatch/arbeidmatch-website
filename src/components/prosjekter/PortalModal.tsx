"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import styles from "@/components/prosjekter/portal.module.css";

/**
 * The portal's dialog. Every form on the project portal opens in one of these
 * instead of sitting on a page (the owner's decision of 29 September 2026).
 *
 * Desktop: a centred panel over a dimmed page; a click on the dimmed part
 * closes it. Phone (below 640px): the whole screen, sliding up, the title and
 * the close button in a header that stays while the content scrolls. Escape
 * closes; focus stays inside while it is open and goes back to whatever
 * opened it; the page behind does not scroll.
 */

const WIDTH = { wide: 640, narrow: 440 } as const;

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** Dialogs open right now, innermost last: only the top one answers Escape and Tab. */
const stack: string[] = [];

/** The page's own overflow, kept while any dialog is open. */
let locks = 0;
let saved: { html: string; body: string; pad: string } | null = null;

function lockScroll() {
  if (locks++ > 0) return;
  const html = document.documentElement;
  const body = document.body;
  const gap = window.innerWidth - html.clientWidth;
  saved = { html: html.style.overflow, body: body.style.overflow, pad: body.style.paddingRight };
  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (gap > 0) body.style.paddingRight = `${gap}px`;
}

function unlockScroll() {
  if (--locks > 0 || !saved) return;
  const html = document.documentElement;
  const body = document.body;
  html.style.overflow = saved.html;
  body.style.overflow = saved.body;
  body.style.paddingRight = saved.pad;
  saved = null;
}

export type PortalModalProps = {
  title: string;
  onClose: () => void;
  /** "wide" (about 640px, the access form and the choices) or "narrow" (about 440px, login). */
  size?: keyof typeof WIDTH;
  children: React.ReactNode;
};

export default function PortalModal({ title, onClose, size = "wide", children }: PortalModalProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // Open: lock the page, remember the opener, trap Tab, answer Escape.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockScroll();
    stack.push(id);

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      const panel = panelRef.current;
      if (!panel) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0 && !el.closest("[aria-hidden='true']"),
      );
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    // Focus that wanders out (a click on something behind, a script) is brought back.
    const onFocusIn = (e: FocusEvent) => {
      if (stack[stack.length - 1] !== id) return;
      const panel = panelRef.current;
      if (panel && e.target instanceof Node && !panel.contains(e.target)) panel.focus();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocusIn);
      const at = stack.lastIndexOf(id);
      if (at >= 0) stack.splice(at, 1);
      unlockScroll();
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [id]);

  // The first field on a desktop; the dialog itself on a phone, so the keyboard does not jump up.
  // Again whenever the title changes, when one form gives way to another in the same dialog.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const wide = window.matchMedia("(min-width: 640px) and (pointer: fine)").matches;
    let observer: MutationObserver | null = null;
    const t = window.setTimeout(() => {
      const target = wide ? panel.querySelector<HTMLElement>("[data-autofocus]") : null;
      (target ?? panel).focus({ preventScroll: true });
      if (target || !wide) return;
      // A form loaded on demand arrives a moment later: move to its first field once it is there.
      observer = new MutationObserver(() => {
        const late = panel.querySelector<HTMLElement>("[data-autofocus]");
        if (!late) return;
        observer?.disconnect();
        if (document.activeElement === panel) late.focus({ preventScroll: true });
      });
      observer.observe(panel, { childList: true, subtree: true });
    }, 30);
    return () => {
      window.clearTimeout(t);
      observer?.disconnect();
    };
  }, [title]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={styles.modalRoot}>
      <div className={styles.modalBackdrop} aria-hidden="true" onClick={() => closeRef.current()} />
      <div
        ref={panelRef}
        className={styles.modalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ "--modal-w": `${WIDTH[size]}px` } as React.CSSProperties}
      >
        <div className={styles.modalHead}>
          <h2 id={titleId}>{title}</h2>
          <button type="button" className={styles.modalClose} aria-label="Lukk" onClick={() => closeRef.current()}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
