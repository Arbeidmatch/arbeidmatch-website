import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = { filename: string };

export default async function BlogPostFromMarkdown({ filename }: Props) {
  const md = await fs.readFile(path.join(process.cwd(), "content", filename), "utf8");
  return (
    <div className="seo-prose mx-auto max-w-3xl px-4 pb-16 pt-4 md:px-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
}
