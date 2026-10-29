import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPills } from "@/components/CategoryPills";
import { Leaderboard } from "@/components/Leaderboard";
import { Disclaimer, Page } from "@/components/Page";
import { PhoneTitleBar } from "@/components/PhoneBar";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";
import { getBoard } from "@/lib/data";
import { day } from "@/lib/format";

export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const info = categoryBySlug((await params).slug);
  if (!info) return {};
  return {
    title: `${info.label} funds, ranked`,
    description: `${info.intro} Ranked by how their record compares with other ${info.plural}.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const info = categoryBySlug((await params).slug);
  if (!info) notFound();
  const board = await getBoard(info.name);
  if (!board) notFound();
  const unrated = board.funds.length - board.rated;
  const meta = `${board.rated} rated${unrated ? ` · ${unrated} too new to rate` : ""}${board.asOf ? ` · prices as of ${day(board.asOf)}` : ""}`;

  return (
    <>
      <div className="md:hidden">
        <PhoneTitleBar title={`${info.label} funds`}>
          <CategoryPills current={info.slug} phone />
        </PhoneTitleBar>
      </div>
      <Page className="mx-auto max-w-[1280px] pb-6 md:px-8 md:pt-8 md:pb-16 wide:max-w-[1440px]">
        <div className="hidden md:block">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="max-w-[720px]">
              <h1 className="text-[36px] leading-[1.1] font-bold tracking-[-0.02em]">
                {info.label} funds
              </h1>
              <p className="mt-2.5 text-[17px] text-text-2">
                {info.intro} Ranked by how their record compares with other{" "}
                {info.plural}.
              </p>
            </div>
            <p className="text-sm text-text-3">{meta}</p>
          </div>
          <CategoryPills current={info.slug} />
        </div>
        <Leaderboard board={board} />
        <Disclaimer className="mt-7 max-w-[860px] px-4 md:px-0">
          Not investment advice. MF Compass compares funds' past records; past
          returns don't guarantee future ones. Direct, growth plans only. Data:
          AMFI and Kuvera.
        </Disclaimer>
      </Page>
    </>
  );
}
