import type { ReactNode } from "react";

/** Server-only friendly: renders a minimal subset of Markdown (#, ##, paragraphs). */

function renderSimpleMarkdown(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let para: string[] = [];
  let k = 0;

  const flushPara = () => {
    const text = para.join("\n").trim();
    para = [];
    if (!text) return;
    out.push(
      <p key={`p-${k++}`} className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85 whitespace-pre-wrap">
        {text}
      </p>,
    );
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const t = line.trim();

    if (t.startsWith("## ") && !t.startsWith("###")) {
      flushPara();
      out.push(
        <h2 key={`h2-${k++}`} className="mb-3 mt-8 text-xl font-semibold text-[#0D1B2A]">
          {t.slice(3).trim()}
        </h2>,
      );
    } else if (t.startsWith("# ") && !t.startsWith("##")) {
      flushPara();
      out.push(
        <h1 key={`h1-${k++}`} className="mb-4 text-3xl font-bold text-[#0D1B2A]">
          {t.slice(2).trim()}
        </h1>,
      );
    } else if (t === "") {
      flushPara();
    } else {
      para.push(line);
    }
  }
  flushPara();

  return out;
}

export function SimpleLegalMarkdown({ source }: { source: string }) {
  return <div className="legal-md-simple">{renderSimpleMarkdown(source)}</div>;
}
