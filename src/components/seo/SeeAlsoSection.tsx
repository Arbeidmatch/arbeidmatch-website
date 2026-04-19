import Link from "next/link";

export type SeeAlsoLink = { href: string; label: string };

type Props = {
  items: SeeAlsoLink[];
  /** e.g. bg-white vs bg-surface to sit on page background */
  variant?: "surface" | "white";
};

export default function SeeAlsoSection({ items, variant = "surface" }: Props) {
  const bg = variant === "white" ? "bg-white" : "bg-surface";
  return (
    <section className={`border-t border-border ${bg} py-10 md:py-14 lg:py-16`} aria-labelledby="see-also-heading">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <h2 id="see-also-heading" className="am-h3 font-semibold text-navy">
          Se også
        </h2>
        <ul className="mt-5 hidden flex-wrap gap-x-6 gap-y-3 md:flex">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-hover hover:decoration-gold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 -mx-6 px-6 md:hidden">
          <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <li key={item.href} className="w-[min(280px,85vw)] shrink-0 snap-start">
                <Link
                  href={item.href}
                  className="flex min-h-[48px] items-center rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-gold shadow-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
