import type { Metadata, Viewport } from "next";

/**
 * Min side is also the Forsprang app (ORDER 272): its manifest, icons and theme
 * colour belong to these pages only, so the public site keeps its own head.
 */
export const metadata: Metadata = {
  manifest: "/min-side/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/forsprang/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/forsprang/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/forsprang/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, title: "Forsprang", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
};

export default function MinSideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
