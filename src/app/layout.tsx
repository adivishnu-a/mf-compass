import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/ThemeScript";
import { ToastProvider } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CommandMenu } from "@/components/CommandMenu";
import { CompareStickyBar } from "@/components/CompareStickyBar";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const revalidate = 300; // Revalidate layout/footer data every 5 minutes

const inter = Inter({
  variable: "--font-sans-default",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mf-compass.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MF Compass — Mutual Fund Outperformance Discovery",
    template: "%s | MF Compass",
  },
  description: "Identify Indian mutual funds that consistently outperform their peers. Zero ads, zero tracking, purely data-driven discovery.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "MF Compass",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f13" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-brand-gilt/20 selection:text-foreground">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <CommandMenu />
        <CompareStickyBar />
        <ToastProvider />
        <SpeedInsights />
      </body>
    </html>
  );
}
