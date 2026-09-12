import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/blog" },
  title: "Blog | ArbeidMatch",
  description:
    "ArbeidMatch blog: articles about EU/EEA recruitment, Norwegian workforce, and industry insights. Coming soon.",
  robots: { index: true, follow: true },
};

export default function BlogPage() {
  return (
    <div className="min-h-[60vh] bg-white text-navy">
      <div className="mx-auto max-w-[720px] px-6 py-12 md:px-8 md:py-[48px]">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Blog</h1>
        <p className="mt-2 text-xl font-semibold text-gold-ink">Coming soon</p>
        <p className="mt-6 text-base leading-relaxed text-text-secondary">
          We are preparing in-depth articles about EU/EEA recruitment to Norway, blue-collar workforce trends, and
          practical guides for employers and candidates. Check back soon.
        </p>
        <p className="mt-8 text-base leading-relaxed text-text-secondary">
          In the meantime,{" "}
          <Link href="/contact" className="font-medium text-gold-ink underline underline-offset-2 hover:opacity-90">
            contact us if you have questions
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
