"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  h1: ({ children }) => <h1 className="mb-4 text-3xl font-bold text-[#0D1B2A]">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mb-3 mt-8 text-xl font-semibold text-[#0D1B2A]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-lg font-semibold text-[#0D1B2A]">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-base leading-relaxed text-[#0D1B2A]/85">{children}</p>
  ),
  a: ({ href, children }) => (
    <a className="text-[#C9A84C] hover:underline" href={href ?? "#"}>
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-[#0D1B2A]/10" />,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6 text-[#0D1B2A]/85">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6 text-[#0D1B2A]/85">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#0D1B2A]">{children}</strong>,
};

export function LegalMarkdown({ source }: { source: string }) {
  return (
    <div className="legal-md">
      <ReactMarkdown components={components}>{source}</ReactMarkdown>
    </div>
  );
}
