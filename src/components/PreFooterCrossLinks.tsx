import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

type Variant = "employers" | "candidates";
type Lang = "en" | "nb";

type CrossLink = { href: string; label: string; labelNb: string; external?: boolean };

const LEAD: Record<Lang, string> = {
  en: "Looking for something else?",
  nb: "Ser dere etter noe annet?",
};

const CONFIG: Record<Variant, { links: readonly CrossLink[] }> = {
  employers: {
    links: [
      { href: "/for-candidates", label: "See what candidates receive", labelNb: "Se hva kandidatene får" },
      {
        href: "/electricians-norway",
        label: "Looking for electricians in Norway?",
        labelNb: "Ser dere etter elektrikere i Norge?",
      },
    ],
  },
  candidates: {
    links: [
      {
        href: "/for-employers",
        label: "See how this works for employers",
        labelNb: "Se hvordan dette fungerer for arbeidsgivere",
      },
      {
        href: "/jobs",
        label: "Browse open jobs",
        labelNb: "Se ledige stillinger",
        external: true,
      },
    ],
  },
};

export default function PreFooterCrossLinks({ variant, lang = "en" }: { variant: Variant; lang?: Lang }) {
  const { links } = CONFIG[variant];

  return (
    <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
        <ScrollReveal variant="fadeUp">
          <p className="text-[12px] leading-relaxed text-[#888]">
            {LEAD[lang]}{" "}
            {links.map((link, i) => (
              <span key={link.href}>
                {i > 0 ? <span className="text-[#888]"> · </span> : null}
                {link.external || link.href.startsWith("http") ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B8860B]/80 underline-offset-2 transition-colors duration-200 hover:text-[#B8860B] hover:underline"
                  >
                    {lang === "nb" ? link.labelNb : link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="text-[#B8860B]/80 underline-offset-2 transition-colors duration-200 hover:text-[#B8860B] hover:underline"
                  >
                    {lang === "nb" ? link.labelNb : link.label}
                  </Link>
                )}
              </span>
            ))}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
