import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

type Variant = "employers" | "candidates";

const CONFIG: Record<
  Variant,
  { links: readonly { href: string; label: string; external?: boolean }[] }
> = {
  employers: {
    links: [
      { href: "/for-candidates", label: "See what candidates receive" },
      { href: "/dsb-support", label: "Need DSB support for non-EU electricians?" },
    ],
  },
  candidates: {
    links: [
      { href: "/for-employers", label: "See how this works for employers" },
      { href: "https://jobs.arbeidmatch.no", label: "Browse open jobs", external: true },
    ],
  },
};

export default function PreFooterCrossLinks({ variant }: { variant: Variant }) {
  const { links } = CONFIG[variant];

  return (
    <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
        <ScrollReveal variant="fadeUp">
          <p className="text-[12px] leading-relaxed text-[#888]">
            Looking for something else?{" "}
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
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="text-[#B8860B]/80 underline-offset-2 transition-colors duration-200 hover:text-[#B8860B] hover:underline"
                  >
                    {link.label}
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
