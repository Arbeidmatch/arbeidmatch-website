import type { Metadata } from "next";
import Link from "next/link";

import { EYEBROW, MUTED, PRIMARY, SECONDARY } from "@/components/prosjekter/ui";

export const metadata: Metadata = {
  title: { absolute: "Min side | ArbeidMatch" },
  description: "Logg inn for å se og rette opplysningene ArbeidMatch har om firmaet deres.",
  robots: { index: false, follow: false },
};

/**
 * "Min side" without a key: the way in. The login is the portal's own dialog
 * (#logg-inn, mounted in the root layout), so there is no form on this page.
 */
export default function MinSideLandingPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <div className="container-site flex min-h-[60vh] flex-col justify-center gap-5 pb-16 pt-10 md:pb-24 md:pt-14">
        <p className={EYEBROW}>For kunder</p>
        <h1 className="am-h2 font-display font-semibold text-white">Min side</h1>
        <p className={`max-w-xl text-[15px] leading-relaxed ${MUTED}`}>
          Her ser dere opplysningene vi har om firmaet deres, kontaktpersonene, prosjektvarslene, og tilbudene og dokumentene dere har signert. Dere
          logger inn med en lenke vi sender til e-posten deres. Dere trenger ikke passord.
        </p>
        <p className="flex flex-wrap gap-3">
          <Link href="#logg-inn" className={PRIMARY} aria-haspopup="dialog">
            Logg inn
          </Link>
          <Link href="/contact" className={SECONDARY}>
            Kontakt oss
          </Link>
        </p>
      </div>
    </div>
  );
}
