import Link from "next/link";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";

export default function ForEmployersPage() {
  return (
    <>
      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <h1 className="text-4xl font-bold text-navy md:text-5xl">
            Qualified EU/EEA workforce for Norwegian businesses
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
            We help employers in construction, logistics and industry secure reliable workers
            quickly, legally and with full support.
          </p>
          <Link
            href="/request"
            className="mt-8 inline-block rounded-md bg-gold px-8 py-3 font-medium text-white hover:bg-gold-hover"
          >
            Request candidates
          </Link>
        </div>
      </section>

      <HowItWorks />

      <section className="bg-surface py-24">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <h2 className="text-center text-4xl font-bold text-navy">Our services</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              [
                "Sourcing",
                "Targeted outreach across EU/EEA countries to identify candidates that match your exact needs.",
              ],
              [
                "Screening",
                "Structured interviews, documentation checks and trade relevance validation before presentation.",
              ],
              [
                "Staffing & Compliance",
                "Support with contracts, onboarding and compliance with Norwegian labor requirements.",
              ],
            ].map(([title, text]) => (
              <article key={title} className="rounded-xl border border-border bg-white p-8">
                <h3 className="text-xl font-semibold text-navy">{title}</h3>
                <p className="mt-3 text-text-secondary">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="bg-navy py-20 text-center">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <h2 className="text-3xl font-bold text-white">Need workers now?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Send your staffing request and our team will start sourcing immediately.
          </p>
          <Link
            href="/request"
            className="mt-8 inline-block rounded-md bg-gold px-8 py-3 font-medium text-white hover:bg-gold-hover"
          >
            Request candidates
          </Link>
        </div>
      </section>
    </>
  );
}
