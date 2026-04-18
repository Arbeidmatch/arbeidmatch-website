import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

type Variant = "employers" | "candidates";

const CONFIG: Record<
  Variant,
  { links: readonly { href: string; label: string }[] }
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
      { href: "/request", label: "Apply directly through ArbeidMatch" },
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
                <Link
                  href={link.href}
                  className="text-[#B8860B]/80 underline-offset-2 transition-colors duration-200 hover:text-[#B8860B] hover:underline"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
