import type { Metadata, Viewport } from "next";
import { Anek_Latin } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import { CompareTray } from "@/components/CompareTray";
import { Header } from "@/components/Header";
import { MotionPrefs } from "@/components/MotionPrefs";
import { SearchOverlay } from "@/components/SearchOverlay";
import { TabBar } from "@/components/TabBar";
import { themeScript } from "@/components/ThemeToggle";
import { getLookup } from "@/lib/data";
import "./globals.css";

const anek = Anek_Latin({
  variable: "--font-anek",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://mf-compass.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MF Compass · Which mutual funds have really beaten their peers",
    template: "%s · MF Compass",
  },
  description:
    "Every direct equity and hybrid mutual fund in India, compared with others of its kind across years, falls and costs, and explained plainly. Free, no sign-up.",
  applicationName: "MF Compass",
  appleWebApp: {
    capable: true,
    title: "MF Compass",
    statusBarStyle: "default",
  },
  openGraph: { type: "website", siteName: "MF Compass", locale: "en_IN" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const total = await getLookup()
    .then((f) => f.length)
    .catch(() => null);
  return (
    <html lang="en-IN" className={anek.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-on-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <MotionPrefs>
          <Header total={total} />
          <main id="main" className="pb-tabbar flex-1">
            {children}
          </main>
          <CompareTray />
          <Suspense>
            <TabBar />
          </Suspense>
          <SearchOverlay />
        </MotionPrefs>
        <SpeedInsights />
      </body>
    </html>
  );
}
