import type { Metadata } from "next";
import DsbTypeSelector from "@/components/dsb/DsbTypeSelector";

export const metadata: Metadata = {
  title: "DSB Authorization Guide Norway — Choose Your Guide",
  description: "Choose your EU/EEA or Non-EU DSB authorization guide for Norway.",
};

export default function DsbSupportPage() {
  return (
    <>
      <DsbTypeSelector />
      <section className="min-h-[70vh] bg-navy py-16 text-white md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <h1 className="text-center text-3xl font-bold md:text-5xl">Which guide do you need?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-white/80">
            Choose your correct path to access the right DSB authorization guide.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-emerald-300/35 bg-white/5 p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">EU/EEA Path</p>
              <h2 className="mt-3 text-2xl font-bold">I am EU/EEA</h2>
            </article>
            <article className="rounded-2xl border border-amber-300/35 bg-white/5 p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Non-EU Path</p>
              <h2 className="mt-3 text-2xl font-bold">I am Non-EU</h2>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
