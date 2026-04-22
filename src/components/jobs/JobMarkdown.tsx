import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { neutralWordingForPartnerJobMarkdown } from "@/lib/jobs/partnerJobCopy";

export type JobMarkdownCopyAudience = "partner" | "arbeidmatch";

const mdLinkClass = "font-medium text-[#C9A84C] underline decoration-[#C9A84C]/40 underline-offset-2 hover:decoration-[#C9A84C]";

const components = {
  h1: ({ ...props }: ComponentProps<"h1">) => (
    <h1 className="mt-6 text-2xl font-bold tracking-tight text-white first:mt-0 md:text-[1.35rem]" {...props} />
  ),
  h2: ({ ...props }: ComponentProps<"h2">) => (
    <h2
      className="mt-10 border-b border-[rgba(201,168,76,0.22)] pb-2 text-lg font-semibold tracking-tight text-[#C9A84C] first:mt-0 md:text-xl"
      {...props}
    />
  ),
  h3: ({ ...props }: ComponentProps<"h3">) => (
    <h3 className="mt-6 text-base font-semibold text-white md:text-lg" {...props} />
  ),
  h4: ({ ...props }: ComponentProps<"h4">) => (
    <h4 className="mt-5 text-sm font-semibold uppercase tracking-wide text-[#C9A84C]/90" {...props} />
  ),
  p: ({ ...props }: ComponentProps<"p">) => (
    <p className="mt-3 text-sm leading-relaxed text-white/80 first:mt-0 md:text-[15px]" {...props} />
  ),
  ul: ({ ...props }: ComponentProps<"ul">) => (
    <ul
      className="mt-3 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-white/80 marker:text-[#C9A84C] md:text-[15px]"
      {...props}
    />
  ),
  ol: ({ ...props }: ComponentProps<"ol">) => (
    <ol
      className="mt-3 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-white/80 marker:font-semibold marker:text-[#C9A84C] md:text-[15px]"
      {...props}
    />
  ),
  li: ({ ...props }: ComponentProps<"li">) => <li className="pl-1" {...props} />,
  strong: ({ ...props }: ComponentProps<"strong">) => <strong className="font-semibold text-white" {...props} />,
  em: ({ ...props }: ComponentProps<"em">) => <em className="italic text-white/90" {...props} />,
  hr: () => <hr className="my-8 border-0 border-t border-[rgba(201,168,76,0.35)]" />,
  a: ({ ...props }: ComponentProps<"a">) => (
    <a className={mdLinkClass} target="_blank" rel="noopener noreferrer" {...props} />
  ),
  blockquote: ({ ...props }: ComponentProps<"blockquote">) => (
    <blockquote
      className="mt-4 border-l-2 border-[#C9A84C]/50 bg-[rgba(13,27,42,0.45)] py-2 pl-4 pr-2 text-sm text-white/75"
      {...props}
    />
  ),
  code: ({ ...props }: ComponentProps<"code">) => (
    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-[#C9A84C]" {...props} />
  ),
};

export function JobMarkdownBody({
  markdown,
  copyAudience = "arbeidmatch",
}: {
  markdown: string;
  /** Partner/client listings use neutral employer wording; ArbeidMatch-owned listings may keep "we". */
  copyAudience?: JobMarkdownCopyAudience;
}) {
  const trimmed = markdown?.trim() ?? "";
  if (!trimmed) return null;

  const source =
    copyAudience === "partner" ? neutralWordingForPartnerJobMarkdown(trimmed) : trimmed;

  return (
    <div className="job-markdown max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
