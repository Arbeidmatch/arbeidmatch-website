import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Română",
  description: "ArbeidMatch — recrutare EU/EEA pentru angajatori norvegieni.",
  alternates: { canonical: "https://www.arbeidmatch.no/ro" },
};

export default function RomanianLandingPage() {
  return (
    <div className="mx-auto w-full max-w-content px-6 py-16 md:px-12 lg:px-20">
      <h1 className="text-3xl font-extrabold text-navy">Română</h1>
      <p className="mt-4 max-w-2xl text-text-secondary">
        Versiunea în limba română este în lucru. Pentru moment, folosiți site-ul în norvegiană.
      </p>
      <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-gold underline">
        Înapoi la site-ul în norvegiană
      </Link>
    </div>
  );
}
