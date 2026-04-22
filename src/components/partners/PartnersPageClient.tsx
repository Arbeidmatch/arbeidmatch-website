"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, Calculator, GraduationCap, Home, Languages, Scale } from "lucide-react";

import PartnerProfilePreviewModal from "@/components/partners/PartnerProfilePreviewModal";
import { EASE_PREMIUM } from "@/lib/animationConstants";

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
            Tell us what you offer, and we&apos;ll see how it fits our partner network.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-[#b8923f] to-gold px-8 py-3 text-sm font-semibold text-[#0a0f14] shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform duration-300 ease-premium hover:scale-[1.03]"
          >
            Contact us
          </Link>
        </div>
      </section>

      <PartnerProfilePreviewModal
        open={!!openService}
        presenceKey={openService ?? "closed"}
        reduceMotion={!!reduceMotion}
        serviceTitle={openTitle}
        email={email}
        onEmailChange={setEmail}
        onSubmit={() => void submit()}
        onClose={closeModal}
        status={status}
      />
    </div>
  );
}
