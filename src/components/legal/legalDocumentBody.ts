/** Strip leading H1 and "Last updated:" line from stored markdown; return body for renderer and label for subheading. */
export function splitLegalMarkdownFrontMatter(markdown: string): {
  body: string;
  lastUpdatedFromContent: string | null;
} {
  let rest = markdown.trimStart();
  rest = rest.replace(/^#\s+[^\n]+\n+/m, "");
  const m = rest.match(/^Last updated:\s*(.+)\n+/im);
  let lastUpdatedFromContent: string | null = null;
  if (m) {
    lastUpdatedFromContent = m[1].trim();
    rest = rest.replace(/^Last updated:\s*.+\n+/im, "");
  }
  return { body: rest.trimStart(), lastUpdatedFromContent };
}
