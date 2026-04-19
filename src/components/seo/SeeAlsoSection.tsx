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
    <section className={`border-t border-border ${bg} py-10 md:py-12`} aria-labelledby="see-also-heading">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h2 id="see-also-heading" className="text-lg font-semibold text-navy md:text-xl">
          Se også
        </h2>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm font-medium text-gold underline decoration-gold/40 underline-offset-4 transition-colors hover:text-gold-hover hover:decoration-gold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
