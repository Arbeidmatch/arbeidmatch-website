import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polski",
  description: "ArbeidMatch - rekrutacja z UE/EOG dla norweskich pracodawców.",
  alternates: { canonical: "https://www.arbeidmatch.no/pl" },
};

export default function PolishLandingPage() {
  return (
    <div className="mx-auto w-full max-w-content px-6 py-16 md:px-12 lg:px-20">
      <h1 className="text-3xl font-extrabold text-navy">Polski</h1>
      <p className="mt-4 max-w-2xl text-text-secondary">
        Wersja językowa jest w przygotowaniu. Prosimy obecnie o korzystanie z norweskiej strony głównej.
      </p>
      <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-gold underline">
        Wróć do strony norweskiej
      </Link>
    </div>
  );
}
