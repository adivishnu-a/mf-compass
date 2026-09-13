import type { Metadata } from "next";
import { FundsExplorer } from "@/components/funds/FundsExplorer";
import { getLeaderboard, type LeaderboardFund } from "@/lib/funds/queries";
import { EQUITY_CATEGORIES, HYBRID_CATEGORIES } from "@/lib/kuvera/categories";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function resolveSelection(
  params: Record<string, string | string[] | undefined>,
) {
  const group = params.group === "hybrid" ? "hybrid" : "equity";
  const categories = group === "equity" ? EQUITY_CATEGORIES : HYBRID_CATEGORIES;
  const requested = typeof params.category === "string" ? params.category : "";
  const category = (categories as readonly string[]).includes(requested)
    ? requested
    : categories[0];
  const isDefault = group === "equity" && category === categories[0];
  return { group, category, isDefault } as const;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { group, category, isDefault } = resolveSelection(await searchParams);
  const label = category.replace(/\s+fund$/i, "");
  return {
    title: isDefault
      ? "Outperformance Leaderboard"
      : `${label} funds ranked by outperformance`,
    description: `${category} mutual funds ranked by outperformance against their category average, not raw returns. Direct growth plans only, refreshed daily.`,
    alternates: {
      canonical: isDefault
        ? "/funds"
        : `/funds?group=${group}&category=${encodeURIComponent(category)}`,
    },
  };
}

export default async function FundsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { group, category } = resolveSelection(await searchParams);

  let funds: LeaderboardFund[] = [];
  let error: string | null = null;
  try {
    funds = await getLeaderboard(category);
  } catch (err) {
    console.error("Error loading leaderboard:", err);
    error = "Failed to load funds. Please try again.";
  }

  return (
    <FundsExplorer
      group={group}
      category={category}
      funds={funds}
      error={error}
    />
  );
}
