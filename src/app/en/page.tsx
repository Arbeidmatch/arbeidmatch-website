import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "English",
  description: "ArbeidMatch — EU/EEA recruitment for Norwegian employers.",
  alternates: { canonical: "https://www.arbeidmatch.no/en" },
};

export default function EnglishLandingPage() {
  return (
    <div className="mx-auto w-full max-w-content px-4 py-16 md:px-6">
      <h1 className="text-3xl font-extrabold text-navy">English</h1>
      <p className="mt-4 max-w-2xl text-text-secondary">
        This language version is being expanded. For now, please use the Norwegian site for the full experience.
      </p>
      <Link href="/" className="mt-8 inline-flex text-sm font-semibold text-gold underline">
        Back to Norwegian site
      </Link>
    </div>
  );
}
