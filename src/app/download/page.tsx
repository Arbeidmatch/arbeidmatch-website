"use client";

import Link from "next/link";
import { Apple, QrCode, Smartphone } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <section className="border-b border-[#C9A84C]/25 bg-[#0D1B2A] px-4 py-16 md:px-6">
        <div className="mx-auto max-w-content text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#C9A84C]/45 bg-[#0F2236] text-2xl font-bold text-[#C9A84C]">
            AM
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Download ArbeidMatch App
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-200 md:text-lg">
            Manage your recruitment pipeline from anywhere
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-content gap-6 px-4 py-12 md:grid-cols-3 md:px-6">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">
            <Smartphone size={24} />
          </div>
          <h2 className="text-xl font-semibold text-[#0D1B2A]">Android</h2>
          <p className="mt-2 text-sm text-slate-600">
            Version 1.0.0, requires Android 8.0+
          </p>
          <Link
            href="/downloads/arbeidmatch.apk"
            className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[#C9A84C] px-4 py-2.5 text-sm font-semibold text-[#0D1B2A] transition hover:brightness-95"
          >
            Download APK
          </Link>
          <p className="mt-4 text-xs text-slate-500">
            Enable &quot;Install from unknown sources&quot; in settings
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">
            <Apple size={24} />
          </div>
          <h2 className="text-xl font-semibold text-[#0D1B2A]">iOS</h2>
          <p className="mt-2 text-sm text-slate-600">Coming Soon to App Store</p>
          <button
            disabled
            className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
          >
            App Store
          </button>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">
            <Smartphone size={24} />
          </div>
          <h2 className="text-xl font-semibold text-[#0D1B2A]">Google Play</h2>
          <p className="mt-2 text-sm text-slate-600">Coming Soon on Google Play</p>
          <button
            disabled
            className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center rounded-md border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
          >
            Google Play
          </button>
        </article>
      </section>

      <section className="mx-auto w-full max-w-content px-4 pb-14 md:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0D1B2A]/5 text-[#0D1B2A]">
            <QrCode size={20} />
          </div>
          <h3 className="text-lg font-semibold text-[#0D1B2A]">Scan QR code</h3>
          <p className="mt-1 text-sm text-slate-600">Open download page directly on your mobile device</p>
          <div className="mt-4 flex justify-center">
            <div className="rounded-lg border border-slate-200 p-3">
              <QRCodeCanvas value="https://arbeidmatch.no/download" size={170} bgColor="#ffffff" fgColor="#0D1B2A" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#C9A84C]/25 bg-[#0D1B2A] px-4 py-5 text-center text-sm text-[#C9A84C]">
        Secure, encrypted, GDPR compliant
      </footer>
    </div>
  );
}
