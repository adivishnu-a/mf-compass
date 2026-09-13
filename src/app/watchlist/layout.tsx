import type { Metadata } from "next";

// Per-visitor page built from local storage; nothing for a crawler to index.
export const metadata: Metadata = {
  title: "Watchlist",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
