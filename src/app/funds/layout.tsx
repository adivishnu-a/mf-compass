import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outperformance Leaderboard",
  description:
    "Indian equity and hybrid mutual funds ranked by outperformance against their category average, not raw returns. Direct growth plans only, refreshed daily.",
  alternates: { canonical: "/funds" },
};

export default function FundsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
