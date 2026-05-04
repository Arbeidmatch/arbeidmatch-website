import Link from "next/link";

import type { AtsLegalDocumentJson } from "@/lib/atsLegalDocument";
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

  return (
    <section className="min-h-[60vh] bg-white text-[#0D1B2A]">
      <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-12 md:py-12">
        <article lang="en">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#0D1B2A]">{doc.name}</h1>
            {lastLine ? <p className="mt-2 text-[12px] italic text-[#0D1B2A]/60">{lastLine}</p> : null}
          </header>
          <SimpleLegalMarkdown source={doc.content_md} />
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
