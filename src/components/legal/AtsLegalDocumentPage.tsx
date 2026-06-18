import Link from "next/link";

import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
import { sanitizeLegalHtml, stripLeadingH1 } from "@/lib/sanitize-legal-html";
import { SimpleLegalMarkdown } from "@/components/legal/SimpleLegalMarkdown";

function formatIsoDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function AtsLegalDocumentFallback() {
  return (
    <section className="min-h-[50vh] bg-white text-[#0D1B2A]">
      <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-12">
        <p className="text-base leading-relaxed text-[#0D1B2A]/85">
          Document not currently available. Contact legal@arbeidmatch.no
        </p>
      </div>
    </section>
  );
}

export function AtsLegalDocumentPage({ doc }: { doc: AtsLegalDocumentJson }) {
  const lastLine = doc.updated_at ? `Last updated: ${formatIsoDate(doc.updated_at)}` : null;

  // Prefer content_html (the authoritative, editor-published field).
  // Fall back to content_md only when HTML is absent.
  const useHtml = typeof doc.content_html === "string" && doc.content_html.trim().length > 0;
  const safeHtml = useHtml
    ? sanitizeLegalHtml(stripLeadingH1(doc.content_html))
    : null;

  return (
    <section className="min-h-[60vh] bg-white text-[#0D1B2A]">
      <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-12 md:py-12">
        <article lang="en">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#0D1B2A]">{doc.name}</h1>
            {lastLine ? <p className="mt-2 text-[12px] italic text-[#0D1B2A]/60">{lastLine}</p> : null}
          </header>
          {safeHtml != null ? (
            // Content is sanitized server-side via sanitizeLegalHtml before reaching here.
            // eslint-disable-next-line react/no-danger
            <div
              className={[
                "space-y-2",
                "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[#0D1B2A] [&_h2]:mt-8 [&_h2]:mb-3",
                "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#0D1B2A] [&_h3]:mt-5 [&_h3]:mb-2",
                "[&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-[#0D1B2A] [&_h4]:mt-4",
                "[&_p]:text-base [&_p]:leading-relaxed [&_p]:text-[#0D1B2A]/85 [&_p]:mb-4",
                "[&_strong]:font-semibold [&_strong]:text-[#0D1B2A]",
                "[&_em]:italic [&_em]:text-[#0D1B2A]/80",
                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:space-y-1",
                "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mt-2 [&_ol]:space-y-1",
                "[&_li]:text-base [&_li]:leading-relaxed [&_li]:text-[#0D1B2A]/85",
                "[&_a]:text-[#C9A84C] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80",
                "[&_hr]:border-[#0D1B2A]/10 [&_hr]:my-6",
                "[&_table]:w-full [&_table]:border-collapse [&_table]:text-base",
                "[&_th]:border [&_th]:border-[#0D1B2A]/15 [&_th]:bg-[#0D1B2A]/5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-[#0D1B2A]",
                "[&_td]:border [&_td]:border-[#0D1B2A]/15 [&_td]:px-3 [&_td]:py-2 [&_td]:leading-relaxed [&_td]:text-[#0D1B2A]/85",
                "[&_blockquote]:border-l-2 [&_blockquote]:border-[#C9A84C]/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#0D1B2A]/70",
              ].join(" ")}
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          ) : (
            <SimpleLegalMarkdown source={doc.content_md} />
          )}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/legal-request"
              className="inline-flex w-fit rounded-[4px] bg-[#C9A84C] px-6 py-3 text-center text-[15px] font-semibold text-[#0D1B2A] transition-opacity hover:opacity-95"
            >
              Have a legal question? Contact us
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
