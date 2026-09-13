"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { CANDIDATE_PORTAL_LOGIN_URL } from "@/lib/candidatePortal";

export function HomeNavigation({ lang }: { lang: "en" | "no" }) {
  const [open, setOpen] = useState(false);
  const no = lang === "no";
  const links = [
    { href: "/jobs", text: no ? "Finn jobber" : "Find jobs" },
    { href: "/for-employers", text: no ? "For bedrifter" : "For employers" },
    { href: "/contact", text: no ? "Kontakt" : "Contact" },
  ];
  return <header className="sticky top-0 z-[210] border-b border-white/10 bg-navy text-white">
    <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-3 px-5 sm:h-[72px] sm:px-6">
      <Link href={no ? "/no" : "/"} aria-label="ArbeidMatch home" className="flex shrink-0 items-center gap-2.5">
        <Image src="/brand/arbeidmatch-emblem.png" alt="" width={38} height={38} className="object-contain" />
        <span className="text-lg font-bold tracking-tight">Arbeid<span className="text-gold">Match</span><span className="block text-[9px] font-medium uppercase tracking-[0.28em] text-white/60">Norge</span></span>
        <span className="inline-flex items-center rounded-[4px] bg-gold px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-[0.05em] text-navy">BETA</span>
      </Link>
      <nav aria-label={no ? "Hovedmeny" : "Main navigation"} className="hidden items-center gap-7 md:flex">
        {links.map(link => <Link key={link.href} href={link.href} className="py-3 text-sm font-medium text-white/85 hover:text-gold">{link.text}</Link>)}
      </nav>
      <div className="flex items-center gap-3">
        <Link href={no ? "/" : "/no"} aria-label={no ? "Switch to English" : "Bytt til norsk"} className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-white/80 hover:text-gold">{no ? "EN" : "NO"}</Link>
        <a href={CANDIDATE_PORTAL_LOGIN_URL} className="hidden min-h-11 items-center rounded-lg border border-white/25 px-5 text-sm font-semibold hover:border-gold sm:inline-flex">{no ? "Logg inn" : "Log in"}</a>
        <button type="button" aria-label={open ? (no ? "Lukk meny" : "Close menu") : (no ? "Åpne meny" : "Open menu")} aria-expanded={open} aria-controls="home-mobile-nav" onClick={() => setOpen(!open)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 md:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
    {open && <nav id="home-mobile-nav" aria-label={no ? "Mobilmeny" : "Mobile navigation"} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} className="border-t border-white/10 px-5 py-3 md:hidden">
      {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm hover:bg-white/10">{link.text}</Link>)}
      <a href={CANDIDATE_PORTAL_LOGIN_URL} className="block rounded-lg px-3 py-3 text-sm text-gold">{no ? "Logg inn" : "Log in"}</a>
    </nav>}
  </header>;
}
