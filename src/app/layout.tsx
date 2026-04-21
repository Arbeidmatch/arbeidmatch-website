import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BetaBanner from "@/components/BetaBanner";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import CookieConsent from "@/components/CookieConsent";
import HomeJsonLd from "@/components/seo/HomeJsonLd";

const DeferredAppOverlays = dynamic(() => import("@/components/client/DeferredAppOverlays"), { loading: () => null });

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.arbeidmatch.no"),
  title: {
    default: "ArbeidMatch | EU/EEA Recruitment for Norwegian Employers",
    template: "%s | ArbeidMatch",
  },
  description:
    "ArbeidMatch connects Norwegian employers with pre-screened EU/EEA blue-collar workers. Fast, compliant recruitment across construction, offshore, transport and more.",
  alternates: {
    languages: {
      "nb-NO": "https://www.arbeidmatch.no/",
      en: "https://www.arbeidmatch.no/en",
      ro: "https://www.arbeidmatch.no/ro",
      pl: "https://www.arbeidmatch.no/pl",
      "x-default": "https://www.arbeidmatch.no/",
    },
  },
  keywords: [
    "recruitment norway",
    "EU EEA workers norway",
    "bemanning norge",
    "rekruttering",
    "blue collar workers norway",
    "EU workforce",
  ],
  authors: [{ name: "ArbeidMatch Norge AS" }],
  creator: "ArbeidMatch Norge AS",
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: "https://www.arbeidmatch.no",
    siteName: "ArbeidMatch",
    title: "ArbeidMatch | EU/EEA Recruitment for Norwegian Employers",
    description:
      "Pre-screened EU/EEA workers for Norwegian companies. Construction, offshore, transport, automotive and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ArbeidMatch | EU/EEA Recruitment Norway",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArbeidMatch | EU/EEA Recruitment for Norwegian Employers",
    description: "Pre-screened EU/EEA workers for Norwegian companies.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb" className={`h-full overflow-x-hidden antialiased ${fontSans.variable}`}>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-[#0D1B2A] font-sans text-white">
        <BetaBanner />
        <ScrollProgressBar />
        <Navbar />
        <main className="flex min-w-0 flex-1 flex-col overflow-x-clip pb-[40px]">{children}</main>
        <Footer />
        <DeferredAppOverlays />
        <CookieConsent />
        <HomeJsonLd />
      </body>
    </html>
  );
}
