"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { TocItem } from "@/lib/dsbGuideMarkdown";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

type Props = {
  markdown: string;
  toc: TocItem[];
  guideSlug: DsbGuideSlug;
  accessMode: "public" | "licensed";
  email?: string;
  expiresAtIso?: string;
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

export default function DsbGuideViewer({
  markdown,
  toc,
  guideSlug,
  accessMode,
  email = "",
  expiresAtIso = "",
}: Props) {
  const headingCursorRef = useRef(0);
  const sectionModeRef = useRef<SectionMode>("default");
  const stepCountRef = useRef(0);
  const [activeId, setActiveId] = useState<string>("");
  const [protectionMessage, setProtectionMessage] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [mobileTocMounted, setMobileTocMounted] = useState(false);

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
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
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
      const isProtectedShortcut =
        event.key === "PrintScreen" ||
        (event.ctrlKey && event.shiftKey && key === "s") ||
        (event.metaKey && event.shiftKey && key === "4") ||
        (event.metaKey && event.shiftKey && key === "3") ||
        (event.ctrlKey && key === "p") ||
        (event.metaKey && key === "p");
      if (isProtectedShortcut) {
        event.preventDefault();
        const message = "This content is protected. Screenshots and printing are not permitted.";
        showProtection(message);
        window.alert(message);
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

  useEffect(() => {
    if (mobileTocOpen) {
      setMobileTocMounted(true);
      return;
    }
    const timeout = window.setTimeout(() => setMobileTocMounted(false), reducedMotionEnabled() ? 0 : 250);
    return () => window.clearTimeout(timeout);
  }, [mobileTocOpen]);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: reducedMotionEnabled() ? "auto" : "smooth",
      block: "start",
    });
  };

  const title = guideSlug === "eu" ? "DSB Guide: EU/EEA Electricians" : "DSB Guide: Non-EU Electricians";
  const watermarkText =
    accessMode === "public"
      ? "ArbeidMatch DSB informational guide"
      : `Licensed to: ${email} - arbeidmatch.no`;
  const watermarkItems = Array.from({ length: 36 }, (_, index) => `${watermarkText} · ${index + 1}`);

  return (
    <div className="relative min-h-screen bg-surface pb-[76px] pt-8">
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
          {accessMode === "public" ? (
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              Free informational guide for candidates. Always confirm current rules on{" "}
              <a
                href="https://www.dsb.no/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold underline"
              >
                DSB.no
              </a>
              .
            </p>
          ) : (
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
          )}
          {accessMode === "licensed" ? (
            <div className="mt-4 rounded-lg border border-gold/35 bg-black/20 px-4 py-3 text-sm leading-relaxed text-white/85">
              This content is licensed for personal use only. Copying, sharing or reproducing this guide is
              prohibited and may result in legal action.
            </div>
          ) : null}
        </header>

        <div className="sticky top-[60px] z-40 mb-4 h-11 overflow-hidden border-b border-black/10 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTocOpen((o) => !o)}
            className="flex h-full w-full items-center justify-between gap-3"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
              <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-[#C9A84C]">Section</span>
              <span className="truncate text-[13px] font-semibold text-[#0f1923]">{currentSection}</span>
            </span>
            <span className="rounded-md border border-black/10 px-2 py-1 text-[12px] text-black/50">All sections</span>
          </button>
        </div>

        <div className="relative z-10 lg:mx-auto lg:grid lg:max-w-[1100px] lg:grid-cols-[220px_1fr] lg:items-start lg:gap-12">
          <aside className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-100px)] lg:w-[220px] lg:shrink-0 lg:overflow-visible">
            <p className="mb-3 border-b border-black/10 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#C9A84C]">
              Contents
            </p>
            <nav aria-label="Table of contents">
              <ul className="space-y-1">
                {resolvedToc.map((item) => {
                  return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.id);
                        setActiveId(item.id);
                      }}
                      className={`block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap rounded-md border-l-2 border-l-transparent px-2 py-1 text-left no-underline transition-all duration-150 ease-out ${
                        item.level === 3 ? "pl-5 text-[11px] font-normal text-black/40" : "text-[12px] font-medium text-black/50"
                      } ${
                        activeId === item.id
                          ? "border-l-[#C9A84C] bg-[rgba(201,168,76,0.08)] font-semibold text-[#C9A84C]"
                          : "hover:border-l-[rgba(201,168,76,0.15)] hover:bg-[rgba(201,168,76,0.08)] hover:text-[#0f1923]"
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0">
            <article
              className="dsb-guide-content prose-guide rounded-xl border border-border bg-white px-5 py-6 md:px-12 md:py-10"
              data-guide-slug={guideSlug}
              style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none", paddingBottom: "60px" }}
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
                    const isDisclaimer = lower.includes("disclaimer") || lower.includes("legal");
                    const isUsefulLinks = lower.includes("useful links");

                    sectionModeRef.current = isStep ? "step" : isDisclaimer ? "disclaimer" : isUsefulLinks ? "links" : "default";
                    if (isStep) stepCountRef.current += 1;

                    if (isStep) {
                      return (
                        <h2
                          id={id}
                          className="scroll-mt-24 mb-3 mt-8 flex items-center gap-4 rounded-[12px] border border-black/10 border-l-[3px] border-l-[#C9A84C] bg-[rgba(255,255,255,0.03)] px-6 py-5 text-[17px] font-bold leading-[1.3] text-[#0f1923]"
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
                          isDisclaimer ? "mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#E24B4A]" : ""
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
                          className="scroll-mt-24 mb-3 mt-6 flex items-center gap-4 rounded-[12px] border border-black/10 border-l-[3px] border-l-[#C9A84C] bg-[rgba(255,255,255,0.03)] px-6 py-5 text-[17px] font-bold leading-[1.3] text-[#0f1923]"
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
                      <h3 id={id} className="scroll-mt-24 mb-2 mt-6 text-[17px] font-semibold text-[rgba(255,255,255,0.7)]" {...props}>
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children, ...props }) => (
                    <p
                      className={`mb-4 max-w-[680px] text-[15px] leading-[1.8] text-[rgba(255,255,255,0.7)] ${
                        sectionModeRef.current === "disclaimer"
                          ? "my-5 rounded-xl border border-[rgba(226,75,74,0.1)] border-l-4 border-l-[#E24B4A] bg-[rgba(226,75,74,0.1)] px-6 py-5 text-[13px] leading-[1.7] text-[rgba(255,255,255,0.7)]"
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
                      className={`mb-1 mt-1 text-[15px] leading-[1.7] text-[rgba(255,255,255,0.7)] ${
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
                      className="my-5 rounded-r-lg border-l-[3px] border-l-[#C9A84C] bg-[rgba(201,168,76,0.08)] px-5 py-4 text-[14px] leading-[1.65] text-[rgba(255,255,255,0.7)]"
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
                      style={{
                        color: "#C9A84C",
                        textDecoration: "underline",
                        textDecorationColor: "rgba(201,168,76,0.15)",
                        fontWeight: 500,
                        transition: "color 150ms",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#b8953f";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#C9A84C";
                      }}
                      {...props}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {children}
                        <ExternalLink size={14} className="text-[#C9A84C]" aria-hidden />
                      </span>
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto rounded-xl border border-black/10">
                      <table className="w-full border-collapse text-[14px]">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-[#0f1923]">{children}</thead>,
                  th: ({ children }) => (
                    <th className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">
                      {children}
                    </th>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="border-b border-black/10 transition-colors duration-150 hover:bg-[rgba(201,168,76,0.08)]">
                      {children}
                    </tr>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 align-top text-[14px] leading-[1.6] text-[rgba(255,255,255,0.7)] [&:first-child]:whitespace-nowrap [&:first-child]:font-bold [&:first-child]:text-[#C9A84C]">
                      {children}
                    </td>
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
              {accessMode === "public" ? (
                <div className="mt-6 rounded-lg border border-gold/30 bg-surface px-4 py-4 text-sm text-navy">
                  <p className="font-semibold">Need personalized help?</p>
                  <p className="mt-2 leading-relaxed text-text-secondary">
                    Our team can point you to official sources and answer general questions about the process.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-semibold text-white hover:bg-gold-hover"
                  >
                    Contact us
                  </Link>
                </div>
              ) : null}
            </footer>
          </div>
        </div>
      </div>
      {mobileTocMounted ? (
        <>
          <button
            type="button"
            aria-label="Close contents"
            onClick={() => setMobileTocOpen(false)}
            className={`fixed inset-0 z-[59] bg-black/30 transition-opacity duration-300 lg:hidden ${mobileTocOpen ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDuration: reducedMotionEnabled() ? "0ms" : undefined }}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 z-[60] max-h-[70vh] overflow-y-auto rounded-t-[20px] bg-white px-0 pb-8 pt-5 transition-transform duration-300 ease-out lg:hidden ${
              mobileTocOpen ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ transitionDuration: reducedMotionEnabled() ? "0ms" : undefined }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded bg-black/20" />
            <p className="mb-3 px-5 text-[13px] font-bold text-[#0f1923]">Contents</p>
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
                className={`block border-b border-black/10 py-3 text-left leading-[1.4] ${
                  item.level === 3 ? "pl-9 pr-5 text-[14px] text-black/60" : "px-5 text-[15px] text-[#0f1923]"
                } ${activeId === item.id ? "bg-[rgba(201,168,76,0.08)] font-semibold text-[#C9A84C]" : ""}`}
              >
                {item.text}
              </a>
            ))}
          </div>
        </>
      ) : null}
      {protectionMessage ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-xl border border-gold/30 bg-navy px-6 py-5 text-center">
            <p className="text-lg font-semibold text-white">{protectionMessage}</p>
          </div>
        </div>
      ) : null}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-3 bg-[rgba(15,25,35,0.95)] px-6 py-2 backdrop-blur">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5l8-3Z" stroke="rgba(255,255,255,0.5)" strokeWidth="1.6" />
        </svg>
        <p className="text-center text-[11px] italic text-white/40">
          This guide is for informational purposes only. Always verify current requirements directly with DSB.no before
          submitting any application. ArbeidMatch Norge AS accepts no legal liability.
          {" "}
          <a
            href="https://www.dsb.no/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#C9A84C] underline"
          >
            DSB.no
          </a>
        </p>
      </div>
    </div>
  );
}
