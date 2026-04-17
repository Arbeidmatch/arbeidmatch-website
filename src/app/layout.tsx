import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://arbeidmatch.no"),
  title: {
    default: "ArbeidMatch | EU/EEA Recruitment for Norwegian Employers",
    template: "%s | ArbeidMatch",
  },
  description:
    "ArbeidMatch connects Norwegian employers with pre-screened EU/EEA blue-collar workers. Fast, compliant recruitment across construction, offshore, transport and more.",
  keywords: [
    "recruitment norway",
    "EU EEA workers norway",
    "bemanning norge",
    "rekruttering",
    "blue collar workers norway",
    "arbeidskraft EU",
  ],
  authors: [{ name: "ArbeidMatch Norge AS" }],
  creator: "ArbeidMatch Norge AS",
  openGraph: {
    type: "website",
    locale: "en_NO",
    url: "https://arbeidmatch.no",
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
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RecruitmentAgency",
              name: "ArbeidMatch Norge AS",
              url: "https://arbeidmatch.no",
              logo: "https://arbeidmatch.no/logo.png",
              description:
                "EU/EEA recruitment agency for Norwegian employers. Specialists in blue-collar workers for construction, offshore, transport and more.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Sverre Svendsens veg 38",
                addressLocality: "Ranheim",
                addressRegion: "Trondheim",
                postalCode: "7056",
                addressCountry: "NO",
              },
              email: "post@arbeidmatch.no",
              areaServed: "Norway",
              knowsAbout: [
                "Construction recruitment",
                "Offshore recruitment",
                "EU EEA workers",
                "Blue collar recruitment Norway",
              ],
              sameAs: [],
            }),
          }}
        />
        <GoogleAnalytics gaId="G-W6XXW7Q98" />
      </body>
    </html>
  );
}
