import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ArbeidMatch Norge AS – EU/EEA Workforce for Norwegian Employers",
  description:
    "We source, screen and deliver qualified EU/EEA workers for Norwegian businesses in construction, logistics and industry. Org.nr. 935 667 089.",
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
        <GoogleAnalytics gaId="G-W6XXW7Q98" />
      </body>
    </html>
  );
}
