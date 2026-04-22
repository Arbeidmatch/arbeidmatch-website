"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, Calculator, GraduationCap, Home, Languages, Scale, X } from "lucide-react";

import { EASE_PREMIUM } from "@/lib/animationConstants";

const GOLD = "#C9A84C";

const PARTNER_SERVICES = [
  { id: "accounting_tax" as const, title: "Accounting & Tax Services", Icon: Calculator },
  { id: "authorized_translators" as const, title: "Authorized Translators", Icon: Languages },
  { id: "norwegian_language_courses" as const, title: "Norwegian Language Courses", Icon: GraduationCap },
  { id: "accommodation_norway" as const, title: "Accommodation in Norway", Icon: Home },
  { id: "construction_companies" as const, title: "Construction Companies", Icon: Building2 },
  { id: "legal_services" as const, title: "Legal Services", Icon: Scale },
];

export type PartnerServiceId = (typeof PARTNER_SERVICES)[number]["id"];

export default function PartnersPageClient() {
  const reduceMotion = useReducedMotion();
  const [openService, setOpenService] = useState<PartnerServiceId | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const openTitle = useMemo(
    () => PARTNER_SERVICES.find((s) => s.id === openService)?.title ?? "",
    [openService],
  );

  useEffect(() => {
    if (!openService) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [openService]);

  const closeModal = () => {
    setOpenService(null);
    setEmail("");
    setStatus("idle");
  };

  const openModal = (id: PartnerServiceId) => {
    setOpenService(id);
    setEmail("");
    setStatus("idle");
  };

  const submit = async () => {
    if (!openService || !email.includes("@")) return;
    setStatus("submitting");
    try {
      const response = await fetch("/api/partner-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          service_type: openService,
        }),
      });
      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className="relative min-h-[70vh] overflow-hidden bg-[#0D1B2A] text-white"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, #0D1B2A 72%)" }}
    >
      <section className="relative px-4 py-12 md:py-20">
        <div className="mx-auto w-full max-w-content text-center md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Our network</p>
          <h1 className="mt-4 font-sans text-4xl font-bold tracking-tight md:text-5xl">Trusted Partners</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/70">
            Services that matter to EU/EEA workers and Norwegian employers. Join us and reach the people who need you most.
          </p>
        </div>

        <div className="relative mx-auto mt-16 grid w-full max-w-content gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 md:px-6">
          {PARTNER_SERVICES.map(({ Icon, title, id }, index) => (
            <motion.article
              key={id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-32px" }}
              transition={{ duration: reduceMotion ? 0 : 0.45, ease: EASE_PREMIUM, delay: reduceMotion ? 0 : index * 0.06 }}
              className="card-premium group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.22)] bg-[rgba(255,255,255,0.04)] p-6 shadow-[var(--shadow-card)] backdrop-blur-sm transition-all duration-300 ease-premium hover:border-[rgba(201,168,76,0.42)] hover:bg-[rgba(255,255,255,0.07)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/[0.07] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex flex-1 flex-col">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-105">
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <h2 className="mt-5 font-display text-lg font-semibold text-white">{title}</h2>
                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    onClick={() => openModal(id)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#C9A84C] transition-colors duration-300 hover:text-[#e4cf7a]"
                  >
                    Partner with us
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="relative mx-auto mt-20 max-w-content rounded-2xl border border-[rgba(201,168,76,0.22)] bg-[rgba(255,255,255,0.04)] px-6 py-12 text-center md:px-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Interested in another collaboration?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/65">
            Tell us what you offer — we&apos;ll see how it fits our partner network.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-[#b8923f] to-gold px-8 py-3 text-sm font-semibold text-[#0a0f14] shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform duration-300 ease-premium hover:scale-[1.03]"
          >
            Contact us
          </Link>
        </div>
      </section>

      <AnimatePresence>
        {openService ? (
          <motion.div
            key="partner-interest-modal"
            role="presentation"
            className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            onClick={closeModal}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="partner-interest-title"
              className="pointer-events-auto w-full max-w-[420px]"
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE_PREMIUM }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-[20px] border border-[rgba(201,168,76,0.28)] border-t-2 border-t-[rgba(201,168,76,0.55)] bg-[#0f1923] px-8 py-9 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" strokeWidth={1.8} />
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
                  Partnership
                </p>
                <h2 id="partner-interest-title" className="mt-2 pr-8 text-xl font-bold text-white">
                  {openTitle}
                </h2>

                {status === "success" ? (
                  <p className="mt-8 text-center text-[15px] leading-relaxed text-white/85">
                    Thank you! We&apos;ll be in touch soon.
                  </p>
                ) : (
                  <>
                    <label htmlFor="partner-interest-email" className="mt-8 block text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
                      Enter your email address
                    </label>
                    <input
                      id="partner-interest-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="mt-2 w-full rounded-[14px] border border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.05)] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-[#C9A84C] focus:bg-[rgba(255,255,255,0.07)]"
                    />
                    <p className="mt-3 text-center text-[12px] leading-relaxed text-white/45">
                      We&apos;ll contact you about partnership opportunities
                    </p>
                    <button
                      type="button"
                      onClick={() => void submit()}
                      disabled={!email.includes("@") || status === "submitting"}
                      className="mt-6 w-full rounded-[12px] py-3.5 text-[15px] font-bold text-[#0D1B2A] transition disabled:opacity-45"
                      style={{
                        background: `linear-gradient(135deg, #e4cf7a 0%, ${GOLD} 45%, #a88a3a 100%)`,
                        boxShadow: "0 6px 24px rgba(201,168,76,0.28)",
                      }}
                    >
                      {status === "submitting" ? "Sending…" : "Get in touch"}
                    </button>
                    {status === "error" ? (
                      <p className="mt-3 text-center text-[13px] text-red-300/90">Something went wrong. Please try again.</p>
                    ) : null}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
