import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { FUND_CATEGORIES } from "@/lib/kuvera/categories";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mf-compass.vercel.app";

  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/funds`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/watchlist`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
  ];

  // Category deep-links
  const categoryRoutes = FUND_CATEGORIES.map((cat) => {
    const group = [
      "Large Cap Fund",
      "Mid Cap Fund",
      "Small Cap Fund",
      "Flexi Cap Fund",
      "Multi Cap Fund",
      "Large & Mid Cap fund",
    ].includes(cat)
      ? "equity"
      : "hybrid";

    return {
      url: `${baseUrl}/funds?group=${group}&category=${encodeURIComponent(cat)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    };
  });

  // Fund detail routes dynamically generated from the database
  try {
    const dbFunds = await db.query.funds.findMany({
      columns: {
        kuveraCode: true,
        lastUpdated: true,
      },
    });

    const fundRoutes = dbFunds.map((fund) => ({
      url: `${baseUrl}/fund/${fund.kuveraCode}`,
      lastModified: fund.lastUpdated ? new Date(fund.lastUpdated) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    }));

    return [...routes, ...categoryRoutes, ...fundRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return [...routes, ...categoryRoutes];
  }
}
