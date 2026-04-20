"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import PaywallOverlay from "@/components/premium/PaywallOverlay";
import type { PremiumArticle } from "@/lib/premium/articles";
import { getRelatedArticles } from "@/lib/premium/articles";

function officialSourceHref(label: string): string {
  const key = label.toLowerCase();
  if (key.includes("arbeidstilsynet")) return "https://www.arbeidstilsynet.no";
  if (key.includes("lovdata")) return "https://www.lovdata.no";
  if (key.includes("skatteetaten")) return "https://www.skatteetaten.no";
  if (key.includes("politiet")) return "https://www.politiet.no";
  if (key.includes("nav")) return "https://www.nav.no";
  if (key.includes("udi")) return "https://www.udi.no";
  return "https://www.regjeringen.no";
}

function IconExternal() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="ml-1 inline shrink-0 text-[#C9A84C]" aria-hidden>
      <path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export default function PremiumArticleClient({ article }: { article: PremiumArticle }) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [reauthError, setReauthError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/premium/verify", { credentials: "include" });
        const data = (await res.json()) as { hasAccess?: boolean; email?: string };
        if (!cancelled) {
          setHasAccess(Boolean(data.hasAccess));
          setEmail(typeof data.email === "string" ? data.email : "");
        }
      } catch {
        if (!cancelled) {
          setHasAccess(false);
          setEmail("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onReauth = useCallback(async (nextEmail: string) => {
    const e = nextEmail.trim().toLowerCase();
    if (!e) return;
    setReauthError("");
    try {
      const response = await fetch("/api/premium/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: e }),
      });
      if (!response.ok) {
        throw new Error("premium-start-trial");
      }
      window.location.reload();
    } catch {
      setReauthError("Could not refresh access. Please try again.");
    }
  }, []);

  const related = getRelatedArticles(article.slug, 3);
  const locked = !loading && !hasAccess;

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      <div className="mx-auto max-w-[720px] px-6 py-10 md:py-14">
        <Link href="/premium/browse" className="text-sm font-medium text-[#C9A84C] underline">
          Back to guides
        </Link>
        <span className="mt-6 inline-block rounded-full bg-[rgba(201,168,76,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">
          {article.category}
        </span>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white">{article.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-white/65">{article.excerpt}</p>
        <div className="mt-6 flex flex-wrap gap-3 text-[12px] text-white/45">
          <span>Last updated: {article.lastUpdated}</span>
          <span aria-hidden>|</span>
          <span>Sources: {article.officialSources.join(", ")}</span>
          <span aria-hidden>|</span>
          <span>{article.readingTime} min read</span>
        </div>

        <div
          className="mt-8 rounded-[10px] border-l-[3px] border-solid pl-5 pr-4 py-4"
          style={{ borderLeftColor: "#C9A84C", backgroundColor: "rgba(201,168,76,0.06)" }}
        >
          <p className="text-[13px] font-semibold text-[#C9A84C]">Important</p>
          <p className="mt-2 text-[13px] leading-[1.7] text-white/65">
            This article is for general information only. Always confirm details with the relevant Norwegian authority.
            ArbeidMatch does not provide legal advice.
          </p>
        </div>

        <div className="relative mt-10">
          {loading ? <div className="h-40 animate-pulse rounded-lg bg-white/[0.04]" /> : null}

          {!loading ? (
            <div className="relative z-0">
              <div
                className={`max-w-none text-[17px] leading-[1.85] text-white/80 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_p]:mb-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_strong]:text-white ${
                  locked ? "select-none" : ""
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => {
                      const external = href?.startsWith("http");
                      if (external) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center font-medium text-[#C9A84C] underline underline-offset-2"
                          >
                            {children}
                            <IconExternal />
                          </a>
                        );
                      }
                      return (
                        <Link href={href || "#"} className="text-[#C9A84C] underline">
                          {children}
                        </Link>
                      );
                    },
                  }}
                >
                  {article.bodyMarkdown}
                </ReactMarkdown>
                <div className="mt-12 border-t border-white/10 pt-8">
                  <h2 className="text-lg font-bold text-white">Official sources</h2>
                  <ul className="mt-4 space-y-2 text-[15px] text-[#C9A84C]">
                    {article.officialSources.map((label) => (
                      <li key={label}>
                        <a
                          href={officialSourceHref(label)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                        >
                          {label}
                          <IconExternal />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {locked ? (
                <>
                  <div
                    className="pointer-events-none absolute left-0 right-0 top-[300px] z-[25] bottom-0"
                    style={{
                      background: "linear-gradient(to bottom, transparent 0%, #0f1923 40%)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  />
                  <div className="pointer-events-none absolute left-0 right-0 top-[300px] z-[26] bottom-0 bg-[#0f1923]/20" />
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {related.length ? (
          <section className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-xl font-bold text-white">You might also find useful</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/premium/article/${r.slug}`}
                  className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-[#C9A84C]/40"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C9A84C]">{r.category}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{r.title}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {locked ? <PaywallOverlay email={email} onReauth={onReauth} /> : null}
      {locked && reauthError ? (
        <p className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {reauthError}
        </p>
      ) : null}
    </div>
  );
}
