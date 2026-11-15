import Link from "next/link";

import { Icon } from "@/components/site/Icon";
import { SITE_PATHS, guidePath } from "@/components/site/siteNav";
import { GUIDE_DISCLAIMER, PREMIUM_ARTICLES, type PremiumArticle } from "@/lib/premium/articles";

/**
 * Life in Norway, as in the approved mockup (ORDER 295, stage 5): the guide
 * list and the guide page. The guides are the five articles that lived under
 * /premium, with their own sources and dates; the mockup's six titles were
 * examples of subjects, so only these are published.
 */

const SOURCE_SITES: [string, string][] = [
  ["arbeidstilsynet", "https://www.arbeidstilsynet.no"],
  ["skatteetaten", "https://www.skatteetaten.no"],
  ["politiet", "https://www.politiet.no"],
  ["nav", "https://www.nav.no"],
  ["udi", "https://www.udi.no"],
];

/** The official site a source label names, as the old article page linked it. */
export function officialSourceHref(label: string): string {
  const key = label.toLowerCase();
  return SOURCE_SITES.find(([name]) => key.includes(name))?.[1] ?? "https://www.regjeringen.no";
}

/** "Skatteetaten.no" reads as "Skatteetaten" on a card. */
function sourceName(label: string): string {
  return label.replace(/\.no$/i, "");
}

const WHERE = /^Where to check:\s*/;
const STEP = /^Step (\d+):\s*/;

type Block = { kind: "p"; text: string } | { kind: "steps"; items: { n: string; text: string }[] };

/** The article's own paragraphs; its "Step n:" paragraphs become the numbered steps of the template. */
export function guideBody(article: PremiumArticle): { blocks: Block[]; where: string | null } {
  const blocks: Block[] = [];
  let where: string | null = null;
  for (const raw of article.bodyMarkdown.split(/\n\s*\n/)) {
    const text = raw.trim();
    if (!text || text === GUIDE_DISCLAIMER) continue;
    if (WHERE.test(text)) {
      where = text.replace(WHERE, "");
      continue;
    }
    const step = STEP.exec(text);
    if (step) {
      const last = blocks[blocks.length - 1];
      const item = { n: step[1].padStart(2, "0"), text: text.replace(STEP, "") };
      if (last?.kind === "steps") last.items.push(item);
      else blocks.push({ kind: "steps", items: [item] });
      continue;
    }
    blocks.push({ kind: "p", text });
  }
  return { blocks, where };
}

export function GuideList() {
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <span className="eb">Life in Norway</span>
          <h1>Guides for your first months</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            Practical steps for people who move to Norway for work, written from official Norwegian sources.
          </p>
        </div>
      </section>
      <section className="sec">
        <div className="w">
          <div className="three" style={{ marginTop: 0 }}>
            {PREMIUM_ARTICLES.map((a) => (
              <Link key={a.slug} className="card guide-card" href={guidePath(a.slug)}>
                <span className="eb">{a.category}</span>
                <h2 className="h4">{a.title}</h2>
                <span className="more">
                  <span>Source: {a.officialSources.map(sourceName).join(", ")}</span>
                  <Icon name="arrow" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w close">
          <div>
            <h2 className="h3">New jobs by e-mail</h2>
            <p>Choose your trade once. Free, and no profile needed.</p>
          </div>
          <button type="button" className="btn gold" data-sheet="alerts">
            Choose alerts
          </button>
        </div>
      </section>
    </div>
  );
}

export function GuidePage({ article }: { article: PremiumArticle }) {
  const { blocks, where } = guideBody(article);
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <Link className="crumb" href={SITE_PATHS.lifeInNorway}>
            <Icon name="back" />
            Life in Norway
          </Link>
          <div style={{ maxWidth: 760 }}>
            <span className="eb">{article.category}</span>
            <h1>{article.title}</h1>
            <p className="lede" style={{ maxWidth: 640 }}>
              {article.excerpt}
            </p>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="w">
          <div className="guide">
            {blocks.map((b, i) =>
              b.kind === "p" ? (
                <p key={i}>{b.text}</p>
              ) : (
                <ol key={i} className="steps">
                  {b.items.map((s) => (
                    <li key={s.n}>
                      <b>{s.n}</b>
                      <p>{s.text}</p>
                    </li>
                  ))}
                </ol>
              ),
            )}
            <div className="note">
              <span className="eb">Official source</span>
              <h2 className="h4 srcs">
                {article.officialSources.map((label) => (
                  <a key={label} href={officialSourceHref(label)} target="_blank" rel="noopener noreferrer">
                    {label}
                    <Icon name="arrow" />
                  </a>
                ))}
              </h2>
              {where ? <p>{where}</p> : null}
              <p>
                Last updated {article.lastUpdated} · {article.readingTime} min read
              </p>
            </div>
            <p className="fine">{GUIDE_DISCLAIMER}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
