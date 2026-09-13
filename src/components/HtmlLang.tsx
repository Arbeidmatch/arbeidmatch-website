"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { langForPath } from "@/lib/pageLang";

/**
 * Keeps `<html lang>` right across client navigation. The root layout renders
 * once, so moving from an English page to a Norwegian one would otherwise keep
 * the first page's language. See src/lib/pageLang.ts.
 */
export default function HtmlLang() {
  const pathname = usePathname();
  useEffect(() => {
    const lang = langForPath(pathname);
    if (document.documentElement.lang !== lang) document.documentElement.lang = lang;
  }, [pathname]);
  return null;
}
