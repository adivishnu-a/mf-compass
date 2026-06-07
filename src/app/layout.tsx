import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/ThemeScript";
import { ToastProvider } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CommandMenu } from "@/components/CommandMenu";
import { CompareStickyBar } from "@/components/CompareStickyBar";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-sans-default",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MF Compass — Mutual Fund Outperformance Discovery",
  description: "Identify Indian mutual funds that consistently outperform their peers. Zero ads, zero tracking, purely data-driven discovery.",
  icons: {
    icon: "/favicon.ico",
  },
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
