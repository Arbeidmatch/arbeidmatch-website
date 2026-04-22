import Link from "next/link";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

const roleCardClass =
  "group relative rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]";

function RoleIcon() {
  return (
    <svg
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-hover:scale-110 md:h-6 md:w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M12 3v18M8 8h8M8 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BemanningByggAnleggNb() {
  return (
    <article className="bg-white">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
          <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Construction staffing</p>
          <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold leading-tight tracking-tight text-navy">
            Construction and site staffing with verified EU/EEA talent
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-content space-y-12 px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <section className="max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Norwegian construction projects must balance delivery speed, safety, and skilled workforce availability.
            ArbeidMatch connects employers with pre-screened EU/EEA candidates where documentation and expectations are
            clarified early. We keep communication clear around{" "}
            <Link href="/for-employers" className="font-medium text-gold hover:underline">
              employer requirements
            </Link>{" "}
            and compliant delivery.
          </p>
          <p>
            When you need international construction workers, we assess trade fit, certifications, and language needs.
            Our goal is quality matching, not volume. For regulated roles (for example electricians), DSB support is currently
            in coming soon mode. Start with a staffing brief via{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              request form
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Which roles can we deliver?</h2>
          <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
            {[
              [
                "Concrete worker",
                "Experience with casting, curing, and finishing work in safety-focused construction environments.",
              ],
              ["Tile installer", "Precision work in wet rooms and public buildings with quality-focused execution."],
              ["Carpenter", "Fitting, assembly, and structural work where detail and pace both matter."],
              ["Painter", "Interior and exterior work with strong preparation and finishing standards."],
              ["Scaffolder", "Certified profiles experienced with height safety and project rigging."],
              ["Plumbing support worker", "Structured team support where trade responsibilities are clearly defined."],
              ["Site worker", "Machine-assisted work, setup, and logistics support on active sites."],
              ["Electrician (authorized)", "When projects require Norwegian authorization, we validate requirements before presentation."],
            ].map(([title, text]) => (
              <li key={title} className={`${roleCardClass} p-6 md:p-7`} style={{ padding: "28px 24px" }}>
                <div className="flex items-start gap-3">
                  <RoleIcon />
                  <div>
                    <h3 className="text-lg font-semibold text-navy">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Why choose ArbeidMatch?</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
            {[
              {
                t: "Industry depth",
                b: "We ask precise screening questions about project experience, safety context, and on-site expectations.",
              },
              {
                t: "Compliance in practice",
                b: "We help clarify contracts, documentation, and wage framework expectations within applicable requirements.",
              },
              {
                t: "Predictable delivery",
                b: "With clear scope, we work toward milestones your team can plan around and execute against.",
              },
            ].map((u) => (
              <article key={u.t} className={`${roleCardClass} p-6`} style={{ padding: "28px 24px" }}>
                <div className="flex items-start gap-3">
                  <RoleIcon />
                  <div>
                    <h3 className="text-base font-semibold text-navy">{u.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{u.b}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Frequently asked questions</h2>
          <dl className="mx-auto mt-6 max-w-[800px] space-y-6 px-0 md:px-4">
            {[
              {
                q: "Can we receive candidates quickly?",
                a: "Availability varies by season and certification requirements. With a clear brief, we can often present candidates fast.",
              },
              {
                q: "How do you validate documentation?",
                a: "We review relevant documents and identity records based on role risk and client requirements.",
              },
              {
                q: "Do you support different hiring models?",
                a: "Yes. We adapt the delivery model to your needs and legal framework with clear responsibilities.",
              },
              {
                q: "What about language and HSE?",
                a: "We assess language and practical experience against project demands. Safety readiness is a core requirement.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-navy">{item.q}</dt>
                <dd className="mt-2 text-text-secondary">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-logistikk", label: "Logistics & warehouse" },
            { href: "/bemanning-industri", label: "Industry & production" },
            { href: "/bemanningsbyrå-trondheim", label: "Staffing in Trondheim" },
            { href: "/premium", label: "DSB authorization for electricians, Coming soon" },
          ]}
        />

        <section className="rounded-2xl border border-gold/30 bg-navy px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Ready for compliant staffing on your construction site?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
            Send us your role requirements and we will respond with candidate profiles and a practical delivery plan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link
              href="/request"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-white hover:bg-gold-hover sm:w-auto"
            >
              Request candidates
            </Link>
            <Link
              href="/for-employers"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Explore employer services
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
