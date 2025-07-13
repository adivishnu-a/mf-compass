import type React from "react"
import "./globals.css"
import Header from "./components/Header"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Inter } from "next/font/google"
import { Suspense } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata = {
  title: "MF Compass | Mutual Funds Analysis made simple",
  description:
    "Discover, analyze, and compare India's best mutual funds with MF Compass. Transparent, data-driven rankings and always-fresh insights for smart investors.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`bg-slate-50 ${inter.className}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <div className="sticky top-0 z-50 w-full">
            <Header showNavigation={true} />
          </div>
          {children}
          <Analytics />
          <SpeedInsights />
        </Suspense>
      </body>
    </html>
  )
}
