/**
 * The language of each page, for `<html lang>`.
 *
 * FOUND 13 September 2026: every page said lang="nb", English ones included,
 * so a screen reader read English copy with Norwegian pronunciation and the
 * browser offered to translate a Norwegian page from Norwegian. The site has no
 * locale routing: most pages are English (the candidate side, the job board,
 * the front page, which is declared English with /no as its twin), and the
 * employer side is Norwegian. The root layout cannot see the path without
 * making every page dynamic, so it renders "en" and this map corrects the
 * attribute before first paint (an inline script) and on every client
 * navigation (HtmlLang).
 *
 * Add a prefix here when a page is translated.
 */

export type PageLang = "en" | "nb" | "ro" | "pl";

/** Paths (exact) or prefixes (ending in "/" or "-") whose copy is Norwegian. */
export const NB_PATHS: readonly string[] = [
  "/no",
  "/for-employers",
  "/request",
  "/contact",
  "/for-staffing-agencies",
  "/unsubscribe",
  "/unsubscribed",
  "/bemanning-",
  "/bemanningsbyr",
  "/flislegger",
  "/annonse",
];

export function langForPath(rawPath: string | null | undefined): PageLang {
  let path = String(rawPath ?? "/");
  try {
    path = decodeURIComponent(path);
  } catch {
    /* keep it as it came */
  }
  path = path.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
  if (path === "/ro" || path.startsWith("/ro/")) return "ro";
  if (path === "/pl" || path.startsWith("/pl/")) return "pl";
  for (const entry of NB_PATHS) {
    if (entry.endsWith("-") || entry === "/bemanningsbyr") {
      if (path.startsWith(entry)) return "nb";
    } else if (entry === "/request") {
      // Only the landing page: the wizard under /request/<token> is still English.
      if (path === entry) return "nb";
    } else if (path === entry || path.startsWith(`${entry}/`)) {
      return "nb";
    }
  }
  return "en";
}

/**
 * The same rule as plain JavaScript for the document head, so the attribute is
 * right before the page paints. Written out by hand rather than from
 * `langForPath.toString()`, which a minifier would rename out from under it;
 * pageLang.test.ts runs it against langForPath so the two cannot drift.
 */
export function langDetectSource(): string {
  return [
    "function(p){",
    "try{p=decodeURIComponent(p)}catch(e){}",
    "p=(p||'/').split(/[?#]/)[0].replace(/\\/+$/,'')||'/';",
    "if(p==='/ro'||p.indexOf('/ro/')===0)return'ro';",
    "if(p==='/pl'||p.indexOf('/pl/')===0)return'pl';",
    `var n=${JSON.stringify(NB_PATHS)};`,
    "for(var i=0;i<n.length;i++){var e=n[i];",
    "if(e.charAt(e.length-1)==='-'||e==='/bemanningsbyr'){if(p.indexOf(e)===0)return'nb'}",
    "else if(e==='/request'){if(p===e)return'nb'}",
    "else if(p===e||p.indexOf(e+'/')===0)return'nb'}",
    "return'en'}",
  ].join("");
}

export function pageLangInlineScript(): string {
  return `(function(){try{document.documentElement.lang=(${langDetectSource()})(location.pathname)}catch(e){}})();`;
}
