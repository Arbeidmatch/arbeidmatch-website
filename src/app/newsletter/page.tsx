import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bell, Users, Check } from "lucide-react";
import JobNewsletterForm from "@/components/newsletter/JobNewsletterForm";

export const metadata: Metadata = { title: "Job alerts and candidate updates", description: "Choose job alerts for your trade, or request candidate presentations matched to your company's hiring needs.", alternates: { canonical: "/newsletter" } };

export default function NewsletterPage() {
  return <div className="bg-[#0D1B2A] px-6 py-12 text-white md:py-20">
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">KEEP IN TOUCH WITH ARBEIDMATCH</p><h1 className="mt-5 text-4xl font-semibold tracking-tight text-white md:text-5xl">The right update.<br /><span className="text-[#C9A84C]">For your next step.</span></h1><p className="mt-5 text-base leading-relaxed text-white/75">Looking for work or looking for colleagues? Choose the updates that are useful to you.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section id="candidates" className="scroll-mt-24 rounded-xl border border-white/15 bg-white/[0.035] p-6 md:p-9"><Bell className="mb-5 text-[#C9A84C]" size={27} aria-hidden /><p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">FOR CANDIDATES</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">New jobs in your trade.</h2><p className="mt-3 text-sm leading-relaxed text-white/75">Choose your trade and receive an email when a new matching job is published.</p><JobNewsletterForm /></section>
        <section id="employers" className="scroll-mt-24 rounded-xl bg-[#f8f7f3] p-6 text-[#0D1B2A] md:p-9"><Users className="mb-5 text-[#92752c]" size={27} aria-hidden /><p className="text-xs font-semibold uppercase tracking-widest text-[#856b29]">FOR EMPLOYERS</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#0D1B2A]">Candidates who fit your company.</h2><p className="mt-3 text-sm leading-relaxed text-[#53616c]">Tell us what you need first. Then choose to receive candidate presentations relevant to your request.</p><ol className="my-8 space-y-6">{[["Send a free request", "Tell us the trade, skills, location and when you need someone."], ["Choose candidate updates", "Tick the optional email preference when you complete your request."], ["Receive relevant presentations", "We send presentations when suitable candidates are available, not immediately after your request."]].map(([title, description], index) => <li key={title} className="flex gap-4"><span className="pt-1 text-xs font-semibold text-[#92752c]">0{index + 1}</span><div><h3 className="text-sm font-semibold text-[#0D1B2A]">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#53616c]">{description}</p></div></li>)}</ol><Link href="/request" className="flex min-h-[50px] items-center justify-between gap-4 rounded-lg bg-[#0D1B2A] px-5 py-3 text-sm font-semibold text-white">Start your free request <ArrowUpRight size={20} aria-hidden /></Link><p className="mt-5 flex items-center gap-2 text-xs text-[#53616c]"><Check size={16} aria-hidden /> Free request. No automatic email subscription.</p><p className="mt-4 text-xs leading-relaxed text-[#53616c]">Only the request is free. Any recruitment or staffing service is agreed separately. You can stop candidate updates by contacting post@arbeidmatch.no.</p></section>
      </div>
    </div>
  </div>;
}
