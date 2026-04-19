import fs from "node:fs/promises";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

async function loadPillarMd(): Promise<string> {
  const root = process.cwd();
  const a = await fs.readFile(path.join(root, "content", "dsb-pillar-en-part1.md"), "utf8");
  const b = await fs.readFile(path.join(root, "content", "dsb-pillar-en-part2.md"), "utf8");
  return `${a.trim()}\n\n${b.trim()}`;
}

export default async function DsbPillarFromMarkdown() {
  const md = await loadPillarMd();
  return (
    <div className="seo-prose mx-auto max-w-3xl px-4 pb-16 pt-4 md:px-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
    </div>
  );
}
