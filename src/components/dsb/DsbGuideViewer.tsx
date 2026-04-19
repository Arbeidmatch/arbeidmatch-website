"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, ExternalLink } from "lucide-react";
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
  const sectionModeRef = useRef<"default" | "step" | "disclaimer" | "links">("default");
  const stepCountRef = useRef(0);
  const [activeId, setActiveId] = useState<string | null>(toc[0]?.id ?? null);
  const [protectionMessage, setProtectionMessage] = useState<string | null>(null);

  /* Reset TOC walk cursor before ReactMarkdown renders heading components (same render pass). */
  // eslint-disable-next-line react-hooks/refs -- cursor must reset synchronously before markdown h2/h3 renderers run
  headingCursorRef.current = 0;
  // eslint-disable-next-line react-hooks/refs -- mode must reset before render walk
  sectionModeRef.current = "default";
  // eslint-disable-next-line react-hooks/refs -- reset step badge sequence each render
  stepCountRef.current = 0;

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
  const readText = (node: ReactNode): string => {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(readText).join(" ");
    if (node && typeof node === "object" && "props" in node) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return readText((node as any).props?.children);
    }
    return "";
  };

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

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="print:hidden lg:sticky lg:top-20 lg:w-[250px] lg:max-h-[calc(100vh-100px)] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-black/10 lg:pr-4">
            <nav
              className="rounded-xl border border-border bg-white p-4 lg:p-0"
              aria-label="Table of contents"
            >
              <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/35">Contents</p>
              <ul className="mt-3 space-y-1 text-sm">
                {toc.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
                    <a
                      href={`#${item.id}`}
                      className={`block w-full rounded-lg border-none px-3.5 py-2.5 text-left text-[13px] transition-all duration-150 ease-out ${
                        activeId === item.id
                          ? "border-l-2 border-l-[#C9A84C] bg-[rgba(201,168,76,0.12)] pl-3 text-[#C9A84C] font-semibold"
                          : "bg-transparent text-black/60 hover:bg-[rgba(201,168,76,0.08)] hover:text-[#C9A84C]"
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
              className="prose-guide rounded-xl border border-border bg-white px-5 py-6 md:px-12 md:py-10 print:shadow-none"
              data-guide-slug={guideSlug}
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => (
                    <h1
                      className="mt-0 border-b-2 border-[#C9A84C] pb-3 text-[clamp(22px,3vw,32px)] font-extrabold leading-[1.2] text-[#0f1923]"
                      {...props}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => {
                    const item = toc[headingCursorRef.current];
                    const id = item?.level === 2 ? item.id : undefined;
                    if (item?.level === 2) headingCursorRef.current += 1;
                    const text = readText(children).trim();
                    const lower = text.toLowerCase();
                    const isUsefulLinks = lower.includes("useful links");
                    const isDisclaimer = lower.includes("important legal disclaimer");
                    const isStep = /^step\s*\d+/i.test(text);
                    sectionModeRef.current = isUsefulLinks ? "links" : isDisclaimer ? "disclaimer" : isStep ? "step" : "default";
                    if (isStep) stepCountRef.current += 1;
                    return (
                      <div className={isStep ? "mb-5 mt-10 rounded-2xl border border-black/10 bg-white px-6 py-5" : ""}>
                        <h2
                          id={id}
                          className={`scroll-mt-28 mt-10 mb-3 flex items-center gap-2.5 text-[clamp(18px,2.5vw,24px)] font-bold text-[#0f1923] ${
                            isStep ? "mt-0 mb-0" : ""
                          } ${isDisclaimer ? "uppercase tracking-[0.08em] text-[#E24B4A] text-[12px] font-semibold" : ""}`}
                          {...props}
                        >
                          {isDisclaimer ? <AlertTriangle size={18} className="text-[#E24B4A]" aria-hidden /> : null}
                          {!isDisclaimer ? <span className="inline-block h-6 w-1 rounded-[2px] bg-[#C9A84C]" aria-hidden /> : null}
                          {isStep ? (
                            <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(201,168,76,0.1)] text-sm font-bold text-[#C9A84C]">
                              {stepCountRef.current}
                            </span>
                          ) : null}
                          <span>{children}</span>
                        </h2>
                      </div>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const item = toc[headingCursorRef.current];
                    const id = item?.level === 3 ? item.id : undefined;
                    if (item?.level === 3) headingCursorRef.current += 1;
                    const text = readText(children).trim();
                    const isStep = /^step\s*\d+/i.test(text);
                    if (isStep) {
                      sectionModeRef.current = "step";
                      stepCountRef.current += 1;
                    } else {
                      sectionModeRef.current = "default";
                    }
                    return (
                      <div className={isStep ? "mb-5 mt-6 rounded-2xl border border-black/10 bg-white px-6 py-5" : ""}>
                        <h3
                          id={id}
                          className={`scroll-mt-24 mt-6 mb-2 flex items-center gap-2.5 text-[17px] font-semibold text-[#374151] ${
                            isStep ? "mt-0 mb-0 text-[#0f1923]" : ""
                          }`}
                          {...props}
                        >
                          <span className="inline-block h-5 w-1 rounded-[2px] bg-[#C9A84C]" aria-hidden />
                          {isStep ? (
                            <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(201,168,76,0.1)] text-sm font-bold text-[#C9A84C]">
                              {stepCountRef.current}
                            </span>
                          ) : null}
                          <span>{children}</span>
                        </h3>
                      </div>
                    );
                  },
                  p: ({ children, ...props }) => (
                    <p
                      className={`mb-4 max-w-[680px] text-[15px] leading-[1.8] text-[#374151] ${
                        sectionModeRef.current === "disclaimer"
                          ? "rounded-xl border border-[rgba(226,75,74,0.15)] bg-[rgba(226,75,74,0.04)] px-6 py-5 text-[13px] leading-[1.65] text-black/60"
                          : ""
                      }`}
                      {...props}
                    >
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul
                      className={`my-3 pl-6 ${
                        sectionModeRef.current === "links"
                          ? "list-none space-y-2 pl-0"
                          : "list-none space-y-1 text-[#374151]"
                      }`}
                      {...props}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="my-3 list-none space-y-1 pl-6 text-[#374151]" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li
                      className={`mb-1 mt-1 text-[15px] leading-[1.7] text-[#374151] ${
                        sectionModeRef.current === "links" ? "p-0" : "relative pl-3"
                      }`}
                      {...props}
                    >
                      {sectionModeRef.current === "links" ? null : (
                        <span className="absolute left-0 top-[11px] h-1.5 w-1.5 rounded-full bg-[#C9A84C]" aria-hidden />
                      )}
                      {children}
                    </li>
                  ),
                  a: ({ children, href, ...props }) => (
                    <a
                      href={href}
                      className={`font-medium underline underline-offset-2 ${
                        sectionModeRef.current === "links"
                          ? "flex items-center justify-between rounded-[10px] border border-black/10 bg-white px-[18px] py-3.5 no-underline text-[#0f1923] transition-all duration-200 ease-out hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.04)]"
                          : "text-[#C9A84C] hover:text-[#b8953f]"
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      <span>{children}</span>
                      {sectionModeRef.current === "links" ? <ExternalLink size={16} className="text-[#C9A84C]" aria-hidden /> : null}
                    </a>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="my-5 rounded-r-lg border-l-[3px] border-l-[#C9A84C] bg-[rgba(201,168,76,0.06)] px-5 py-4 text-[14px] not-italic leading-[1.65] text-[#374151]"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children, ...props }) => (
                    <strong className="font-bold text-[#0f1923]" {...props}>
                      {children}
                    </strong>
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
