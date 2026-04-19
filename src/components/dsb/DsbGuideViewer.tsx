"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TocItem } from "@/lib/dsbGuideMarkdown";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

type Props = {
  markdown: string;
  toc: TocItem[];
  email: string;
  expiresAtIso: string;
  guideSlug: DsbGuideSlug;
};

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function DsbGuideViewer({ markdown, toc, email, expiresAtIso, guideSlug }: Props) {
  const headingCursorRef = useRef(0);
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);
  const [protectionMessage, setProtectionMessage] = useState<string | null>(null);

  /* Reset TOC walk cursor before ReactMarkdown renders heading components (same render pass). */
  // eslint-disable-next-line react-hooks/refs -- cursor must reset synchronously before markdown h2/h3 renderers run
  headingCursorRef.current = 0;

  useEffect(() => {
    const ids = toc.map((t) => t.id);
    if (ids.length === 0) return;

    const update = () => {
      let bestId: string | null = null;
      let bestRatio = 0;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const h = Math.max(r.height, 1);
        const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / h;
        if (visible > bestRatio) {
          bestRatio = visible;
          bestId = id;
        }
      }
      if (bestId) setActiveId(bestId);
    };

    const obs = new IntersectionObserver(
      () => {
        update();
      },
      { rootMargin: "-18% 0px -52% 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    window.addEventListener("scroll", update, { passive: true });
    update();

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", update);
    };
  }, [toc]);

  useEffect(() => {
    const hide = () => {
      window.setTimeout(() => setProtectionMessage(null), 2600);
    };

    const showProtection = (message: string) => {
      setProtectionMessage(message);
      hide();
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.ctrlKey && (key === "p" || key === "s")) {
        event.preventDefault();
        showProtection("This content is protected. Printing is not permitted.");
      }
    };

    const onBeforePrint = (event: Event) => {
      event.preventDefault();
      showProtection("This content is protected. Printing is not permitted.");
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeprint", onBeforePrint);

    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, []);

  const title = guideSlug === "eu" ? "DSB Guide: EU/EEA Electricians" : "DSB Guide: Non-EU Electricians";
  const watermarkText = `Licensed to: ${email} - arbeidmatch.no`;
  const watermarkItems = Array.from({ length: 36 }, (_, index) => `${watermarkText} · ${index + 1}`);

  return (
    <div className="relative min-h-screen bg-surface pb-16 pt-8">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-[-20%] flex rotate-[-45deg] flex-wrap content-start gap-12 opacity-[0.03]">
          {watermarkItems.map((item) => (
            <span key={item} className="whitespace-nowrap text-2xl font-semibold text-navy">
              {item}
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <header className="relative z-10 mb-8 rounded-xl border border-border bg-navy px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">{title}</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/90 md:flex-row md:items-center md:justify-between">
            <p>
              <span className="text-white/60">Logged in as </span>
              <span className="font-medium text-white">{email}</span>
            </p>
            <p>
              <span className="text-white/60">Access expires on </span>
              <span className="font-medium text-gold">{formatExpiry(expiresAtIso)}</span>
            </p>
          </div>
          <div className="mt-4 rounded-lg border border-gold/35 bg-black/20 px-4 py-3 text-sm leading-relaxed text-white/85">
            This content is licensed for personal use only. Copying, sharing or reproducing this guide is
            prohibited and may result in legal action.
          </div>
        </header>

        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-start">
          <aside className="lg:sticky lg:top-24 lg:w-64 lg:shrink-0 print:hidden">
            <nav
              className="rounded-xl border border-border bg-white p-4 shadow-[0_8px_24px_rgba(13,27,42,0.06)]"
              aria-label="Table of contents"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-navy">Contents</p>
              <ul className="mt-3 space-y-1 text-sm">
                {toc.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                    <a
                      href={`#${item.id}`}
                      className={`block rounded px-1 py-1 transition-colors ${
                        activeId === item.id ? "bg-gold/15 font-semibold text-navy" : "text-text-secondary hover:text-navy"
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <button
              type="button"
              onClick={() =>
                setProtectionMessage("This content is protected. Printing is not permitted.")
              }
              className="mt-4 w-full rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-surface print:hidden"
            >
              Print this page
            </button>
          </aside>

          <div className="min-w-0 flex-1">
            <article
              className="prose-guide rounded-xl border border-border bg-white px-6 py-8 shadow-[0_10px_30px_rgba(13,27,42,0.06)] print:shadow-none"
              data-guide-slug={guideSlug}
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children, ...props }) => {
                    const item = toc[headingCursorRef.current];
                    const id = item?.level === 2 ? item.id : undefined;
                    if (item?.level === 2) headingCursorRef.current += 1;
                    return (
                      <h2 id={id} className="scroll-mt-28 text-2xl font-bold text-navy" {...props}>
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const item = toc[headingCursorRef.current];
                    const id = item?.level === 3 ? item.id : undefined;
                    if (item?.level === 3) headingCursorRef.current += 1;
                    return (
                      <h3 id={id} className="scroll-mt-24 text-xl font-semibold text-navy" {...props}>
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children, ...props }) => (
                    <p className="mt-3 text-text-secondary leading-relaxed" {...props}>
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-text-secondary" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-text-secondary" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="leading-relaxed" {...props}>
                      {children}
                    </li>
                  ),
                  a: ({ children, href, ...props }) => (
                    <a
                      href={href}
                      className="font-medium text-gold underline underline-offset-2 hover:text-gold-hover"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children, ...props }) => (
                    <code className="rounded bg-surface px-1 py-0.5 text-sm text-navy" {...props}>
                      {children}
                    </code>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </article>

            <footer className="mt-8 rounded-xl border border-border bg-white px-6 py-5 text-xs text-text-secondary print:border-t">
              <p className="font-semibold text-navy">Legal disclaimer</p>
              <p className="mt-2 leading-relaxed">
                This guide is for general information only and does not constitute legal advice. DSB rules and procedures
                may change; always verify requirements on official Norwegian government and DSB websites. ArbeidMatch
                Norge AS is not liable for decisions made based on this content.
              </p>
            </footer>
          </div>
        </div>
      </div>
      {protectionMessage && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-xl border border-gold/30 bg-navy px-6 py-5 text-center shadow-2xl">
            <p className="text-lg font-semibold text-white">
              This content is protected. Printing is not permitted.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
