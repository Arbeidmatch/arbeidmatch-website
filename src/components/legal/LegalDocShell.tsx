import type { ReactNode } from "react";

type Props = {
  label: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
};

export default function LegalDocShell({ label, title, intro, children }: Props) {
  return (
    <div className="min-h-screen bg-[#0D1B2A] pb-20 pt-16 text-white md:pb-28 md:pt-24">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <article className="mx-auto max-w-3xl">
          <header className="mb-14 border-b border-[rgba(201,168,76,0.14)] pb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">{label}</p>
            <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-tight text-white">
              {title}
            </h1>
            <div className="mt-6 text-[15px] font-normal leading-relaxed tracking-tight text-white/60">{intro}</div>
          </header>
          <div className="space-y-14 text-[15px] leading-[1.7] tracking-tight text-white/70">{children}</div>
        </article>
      </div>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">{title}</h2>
      <div className="mt-5 space-y-4 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-white/90">
        {children}
      </div>
    </section>
  );
}
