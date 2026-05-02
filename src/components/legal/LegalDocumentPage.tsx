import Link from "next/link";

import type { LegalDoc } from "@/lib/legal-documents";
import { LegalMarkdown } from "@/components/legal/LegalMarkdown";
import { splitLegalMarkdownFrontMatter } from "@/components/legal/legalDocumentBody";

function formatIsoDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

export function LegalDocumentPage({ doc }: { doc: LegalDoc }) {
  const { body, lastUpdatedFromContent } = splitLegalMarkdownFrontMatter(doc.content_md);
  const lastUpdatedLine =
    lastUpdatedFromContent != null && lastUpdatedFromContent.length > 0
      ? `Last updated: ${lastUpdatedFromContent}`
      : `Last updated: ${formatIsoDate(doc.last_updated)}`;

  return (
    <section className="min-h-[60vh] bg-white text-[#0D1B2A]">
      <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-12 md:py-12">
        <article lang="en">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#0D1B2A]">{doc.title}</h1>
            <p className="mt-2 text-[12px] italic text-[#0D1B2A]/60">{lastUpdatedLine}</p>
          </header>
          <LegalMarkdown source={body} />
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

export function LegalDocumentUnavailable() {
  return (
    <section className="min-h-[50vh] bg-white text-[#0D1B2A]">
      <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-12">
        <p className="text-base leading-relaxed text-[#0D1B2A]/85">
          Document not currently available. For inquiries please contact{" "}
          <a className="font-medium text-[#C9A84C] hover:underline" href="mailto:legal@arbeidmatch.no">
            legal@arbeidmatch.no
          </a>
          .
        </p>
      </div>
    </section>
  );
}
