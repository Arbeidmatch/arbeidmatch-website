"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, ChevronDown, ExternalLink } from "lucide-react";
import type { TocItem } from "@/lib/dsbGuideMarkdown";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

type Props = {
  markdown: string;
  toc: TocItem[];
  email: string;
  expiresAtIso: string;
  guideSlug: DsbGuideSlug;
};

type SectionMode = "default" | "step" | "disclaimer" | "links";

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (node && typeof node === "object" && "props" in node) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return extractText((node as any).props?.children);
  }
  return "";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-|-$/g, "");
}

function reducedMotionEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function DsbGuideViewer({ markdown, toc, email, expiresAtIso, guideSlug }: Props) {
  const headingCursorRef = useRef(0);
  const sectionModeRef = useRef<SectionMode>("default");
  const stepCountRef = useRef(0);
  const [activeId, setActiveId] = useState<string>("");
  const [protectionMessage, setProtectionMessage] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  const resolvedToc = useMemo(() => {
    const seen = new Map<string, number>();
    return toc.map((item) => {
      const base = slugify(item.text) || "section";
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count}`;
      return { ...item, id };
    });
  }, [toc]);

  const currentSection = useMemo(() => {
    const active = resolvedToc.find((i) => i.id === activeId);
    return active?.text || resolvedToc[0]?.text || "Contents";
  }, [activeId, resolvedToc]);

  // eslint-disable-next-line react-hooks/refs -- reset for markdown render pass
  headingCursorRef.current = 0;
  // eslint-disable-next-line react-hooks/refs -- section mode resets per render pass
  sectionModeRef.current = "default";
  // eslint-disable-next-line react-hooks/refs -- step counter resets per render pass
  stepCountRef.current = 0;

  useEffect(() => {
    const headings = document.querySelectorAll<HTMLElement>(".dsb-guide-content h2, .dsb-guide-content h3");
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    headings.forEach((h) => observer.observe(h));
    if (!activeId && headings[0]?.id) setActiveId(headings[0].id);

    return () => observer.disconnect();
  }, [markdown, activeId]);

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

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: reducedMotionEnabled() ? "auto" : "smooth",
      block: "start",
    });
  };

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

        <div className="sticky top-[60px] z-40 mb-4 border-b border-black/10 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTocOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-3"
          >
            <span className="truncate text-left text-[13px] font-semibold text-[#0f1923]">{currentSection}</span>
            <ChevronDown size={16} className={`transition-transform duration-150 ${mobileTocOpen ? "rotate-180" : ""}`} />
          </button>
          {mobileTocOpen ? (
            <div className="absolute left-0 right-0 top-full max-h-[60vh] overflow-y-auto rounded-b-xl border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              {resolvedToc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id);
                    setActiveId(item.id);
                    setMobileTocOpen(false);
                  }}
                  className={`block border-b border-black/5 px-4 py-3 text-[14px] leading-[1.4] ${
                    item.level === 3 ? "pl-7 text-[13px] text-black/50" : "text-black/70"
                  } ${activeId === item.id ? "bg-[rgba(201,168,76,0.06)] font-semibold text-[#C9A84C]" : "hover:bg-[rgba(201,168,76,0.06)]"}`}
                >
                  {item.text}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative z-10 lg:mx-auto lg:grid lg:max-w-[1100px] lg:grid-cols-[240px_1fr] lg:items-start lg:gap-12">
          <aside className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-120px)] lg:w-[240px] lg:overflow-y-auto">
            <p className="mb-4 border-b border-black/10 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">
              Contents
            </p>
            <nav aria-label="Table of contents">
              <ul className="space-y-1">
                {resolvedToc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.id);
                        setActiveId(item.id);
                      }}
                      className={`block rounded-md border-l-2 border-l-transparent px-3 py-1.5 text-left no-underline transition-all duration-150 ease-out ${
                        item.level === 3 ? "pl-6 text-[12px] text-black/45" : "text-[13px] text-black/55"
                      } ${
                        activeId === item.id
                          ? "border-l-[#C9A84C] bg-[rgba(201,168,76,0.08)] font-semibold text-[#C9A84C]"
                          : "hover:border-l-[rgba(201,168,76,0.4)] hover:bg-[rgba(201,168,76,0.06)] hover:text-[#0f1923]"
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
              onClick={() => setProtectionMessage("This content is protected. Printing is not permitted.")}
              className="mt-4 w-full rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-surface print:hidden"
            >
              Print this page
            </button>
          </aside>

          <div className="min-w-0">
            <article
              className="dsb-guide-content prose-guide rounded-xl border border-border bg-white px-5 py-6 md:px-12 md:py-10"
              data-guide-slug={guideSlug}
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => (
                    <h1
                      className="mt-0 mb-2 border-b-2 border-[#C9A84C] pb-3 text-[clamp(22px,3vw,32px)] font-extrabold leading-[1.2] text-[#0f1923]"
                      {...props}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => {
                    const text = extractText(children).trim();
                    const generatedId = slugify(text);
                    const item = resolvedToc[headingCursorRef.current];
                    const id = generatedId || (item?.level === 2 ? item.id : undefined);
                    if (item?.level === 2) headingCursorRef.current += 1;

                    const lower = text.toLowerCase();
                    const isStep = /^step\s*\d+/i.test(text);
                    const isDisclaimer = lower.includes("important legal disclaimer");
                    const isUsefulLinks = lower.includes("useful links");

                    sectionModeRef.current = isStep ? "step" : isDisclaimer ? "disclaimer" : isUsefulLinks ? "links" : "default";
                    if (isStep) stepCountRef.current += 1;

                    if (isStep) {
                      return (
                        <h2
                          id={id}
                          className="scroll-mt-24 mb-3 mt-8 flex items-center gap-4 rounded-[12px] border border-black/10 border-l-[3px] border-l-[#C9A84C] bg-[#f9f8f5] px-6 py-5 text-[17px] font-bold leading-[1.3] text-[#0f1923]"
                          {...props}
                        >
                          <span className="flex h-8 min-h-[32px] w-8 min-w-[32px] items-center justify-center rounded-full bg-[rgba(201,168,76,0.12)] text-sm font-bold text-[#C9A84C]">
                            {stepCountRef.current}
                          </span>
                          <span>{children}</span>
                        </h2>
                      );
                    }

                    return (
                      <h2
                        id={id}
                        className={`scroll-mt-24 mb-3 mt-10 flex items-center gap-2.5 text-[clamp(18px,2.5vw,24px)] font-bold text-[#0f1923] ${
                          isDisclaimer ? "text-[12px] uppercase tracking-[0.08em] text-[#E24B4A]" : ""
                        }`}
                        {...props}
                      >
                        {isDisclaimer ? <AlertTriangle size={18} className="text-[#E24B4A]" aria-hidden /> : <span className="inline-block h-6 w-1 rounded-sm bg-[#C9A84C]" aria-hidden />}
                        <span>{children}</span>
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const text = extractText(children).trim();
                    const generatedId = slugify(text);
                    const item = resolvedToc[headingCursorRef.current];
                    const id = generatedId || (item?.level === 3 ? item.id : undefined);
                    if (item?.level === 3) headingCursorRef.current += 1;

                    const isStep = /^step\s*\d+/i.test(text);
                    sectionModeRef.current = isStep ? "step" : "default";
                    if (isStep) stepCountRef.current += 1;

                    if (isStep) {
                      return (
                        <h3
                          id={id}
                          className="scroll-mt-24 mb-3 mt-6 flex items-center gap-4 rounded-[12px] border border-black/10 border-l-[3px] border-l-[#C9A84C] bg-[#f9f8f5] px-6 py-5 text-[17px] font-bold leading-[1.3] text-[#0f1923]"
                          {...props}
                        >
                          <span className="flex h-8 min-h-[32px] w-8 min-w-[32px] items-center justify-center rounded-full bg-[rgba(201,168,76,0.12)] text-sm font-bold text-[#C9A84C]">
                            {stepCountRef.current}
                          </span>
                          <span>{children}</span>
                        </h3>
                      );
                    }

                    return (
                      <h3 id={id} className="scroll-mt-24 mb-2 mt-6 text-[17px] font-semibold text-[#374151]" {...props}>
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children, ...props }) => (
                    <p
                      className={`mb-4 max-w-[680px] text-[15px] leading-[1.8] text-[#374151] ${
                        sectionModeRef.current === "disclaimer"
                          ? "rounded-r-lg border border-[rgba(226,75,74,0.15)] border-l-[3px] border-l-[#E24B4A] bg-[rgba(226,75,74,0.04)] px-6 py-5 text-[13px] leading-[1.65] text-black/55"
                          : ""
                      }`}
                      {...props}
                    >
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul className={`my-3 ${sectionModeRef.current === "links" ? "list-none space-y-2 p-0" : "list-none space-y-1 pl-0"}`} {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol className="my-3 list-none space-y-1 pl-0" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li
                      className={`mb-1 mt-1 text-[15px] leading-[1.7] text-[#374151] ${
                        sectionModeRef.current === "links" ? "p-0" : "relative pl-4"
                      }`}
                      {...props}
                    >
                      {sectionModeRef.current === "links" ? null : (
                        <span className="absolute left-0 top-[10px] h-1.5 w-1.5 rounded-full bg-[#C9A84C]" aria-hidden />
                      )}
                      {children}
                    </li>
                  ),
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="my-5 rounded-r-lg border-l-[3px] border-l-[#C9A84C] bg-[rgba(201,168,76,0.06)] px-5 py-4 text-[14px] leading-[1.65] text-[#374151]"
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
                  a: ({ children, href, ...props }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        sectionModeRef.current === "links"
                          ? "flex items-center justify-between rounded-[10px] border border-black/10 bg-white px-[18px] py-3.5 text-[14px] font-medium text-[#0f1923] no-underline transition-all duration-180 ease-out hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.04)]"
                          : "font-medium text-[#C9A84C] underline underline-offset-2 hover:text-[#b8953f]"
                      }
                      {...props}
                    >
                      <span>{children}</span>
                      {sectionModeRef.current === "links" ? <ExternalLink size={16} className="text-[#C9A84C]" aria-hidden /> : null}
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
      {protectionMessage ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-xl border border-gold/30 bg-navy px-6 py-5 text-center">
            <p className="text-lg font-semibold text-white">{protectionMessage}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
