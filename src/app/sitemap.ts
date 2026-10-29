import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getLookup } from "@/lib/data";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://mf-compass.vercel.app";
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/funds`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${base}/method`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/learn`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/finder`, changeFrequency: "monthly", priority: 0.5 },
    ...CATEGORIES.map((c) => ({
      url: `${base}/funds/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
  try {
    const funds = await getLookup();
    return [
      ...pages,
      ...funds.map((f) => ({
        url: `${base}/fund/${encodeURIComponent(f.code)}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error("Error listing funds for the sitemap:", error);
    return pages;
  }
}
