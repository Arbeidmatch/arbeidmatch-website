"use client";

import { useEffect } from "react";

/**
 * The legal pages take their language from ?lang, which the path-based rule in
 * src/lib/pageLang.ts cannot see, so the page sets the html lang attribute
 * itself once it is on screen. It runs after HtmlLang's own effect, so it wins.
 */
export default function LegalHtmlLang({ lang }: { lang: "en" | "nb" }) {
  useEffect(() => {
    if (document.documentElement.lang !== lang) document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
