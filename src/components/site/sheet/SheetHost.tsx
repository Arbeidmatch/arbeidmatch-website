"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { siteLang, type SiteLang } from "@/components/site/siteNav";
import { MARKETING_COOKIE_SETTINGS_EVENT } from "@/lib/marketing-cookie-consent";

import { CookiesSheet, LoginSheet, MenuSheet, NotifySheet } from "./sheets";

/**
 * Opens the site's sheets over any page (ORDER 295). A page asks for one with
 * useSheets().open(id), or, from a server component, with a plain element
 * carrying data-sheet="<id>" and optionally data-sheet-set="key=value;key=value"
 * to preset its rows. Only one sheet is open at a time.
 */

export type SheetId = "login" | "menu" | "cookies" | "notify";
export type SheetPreset = Record<string, string>;
export type SheetProps = { lang: SiteLang; preset: SheetPreset; open: boolean; close: () => void; openSheet: (id: SheetId, preset?: SheetPreset) => void };

const SHEETS: Record<SheetId, (p: SheetProps) => ReactNode> = {
  login: LoginSheet,
  menu: MenuSheet,
  cookies: CookiesSheet,
  notify: NotifySheet,
};

type Ctx = { open: (id: SheetId, preset?: SheetPreset) => void; close: () => void };
const SheetContext = createContext<Ctx>({ open: () => {}, close: () => {} });

export function useSheets(): Ctx {
  return useContext(SheetContext);
}

export function parsePreset(raw: string | null | undefined): SheetPreset {
  const out: SheetPreset = {};
  for (const part of String(raw ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}

export function SheetHost({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const lang = siteLang(pathname);
  const [state, setState] = useState<{ id: SheetId; preset: SheetPreset; n: number } | null>(null);
  const [shown, setShown] = useState(false);

  const open = useCallback((id: SheetId, preset: SheetPreset = {}) => {
    setState((s) => ({ id, preset, n: (s?.n ?? 0) + 1 }));
    setShown(true);
  }, []);
  const close = useCallback(() => setShown(false), []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-sheet]");
      if (!el) return;
      const id = el.getAttribute("data-sheet") as SheetId;
      if (!(id in SHEETS)) return;
      e.preventDefault();
      open(id, parsePreset(el.getAttribute("data-sheet-set")));
    };
    const onCookieSettings = () => open("cookies");
    document.addEventListener("click", onClick);
    window.addEventListener(MARKETING_COOKIE_SETTINGS_EVENT, onCookieSettings);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(MARKETING_COOKIE_SETTINGS_EVENT, onCookieSettings);
    };
  }, [open]);

  // A sheet never outlives the page it was opened on.
  useEffect(() => {
    setShown(false);
  }, [pathname]);

  const ctx = useMemo(() => ({ open, close }), [open, close]);
  const Sheet = state ? SHEETS[state.id] : null;

  return (
    <SheetContext.Provider value={ctx}>
      {children}
      {Sheet && state ? <Sheet key={state.n} lang={lang} preset={state.preset} open={shown} close={close} openSheet={open} /> : null}
    </SheetContext.Provider>
  );
}
