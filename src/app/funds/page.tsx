import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KindList, KindTiles } from "@/components/Kinds";
import { Disclaimer, Page } from "@/components/Page";
import { PhoneTitleBar } from "@/components/PhoneBar";
import { categoryByName } from "@/lib/categories";
import { getAllBoards } from "@/lib/data";
import { day } from "@/lib/format";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Explore funds by kind",
  description:
    "Nine kinds of equity and hybrid mutual funds, each ranked by Compass Score.",
};

export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // Links from the old site used ?category=<Kuvera name>.
  const legacy = categoryByName((await searchParams).category);
  if (legacy) redirect(`/funds/${legacy.slug}`);
  const boards = await getAllBoards();
  const total = boards.reduce((s, b) => s + b.funds.length, 0);
  const asOf =
    boards
      .map((b) => b.asOf)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  return (
    <>
      <div className="md:hidden">
        <PhoneTitleBar title="Explore" />
      </div>
      <Page className="mx-auto max-w-[1280px] px-4 pt-4 pb-8 md:px-8 md:pt-8 md:pb-16">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="hidden text-[36px] leading-[1.1] font-bold tracking-[-0.02em] md:block">
            Explore funds by kind
          </h1>
          <p className="text-sm text-text-3">
            {total} direct, growth funds
            {asOf ? ` · prices as of ${day(asOf)}` : ""}
          </p>
        </div>
        <p className="mt-2 max-w-[62ch] text-[15px] text-text-2 md:text-[17px]">
          Funds are only compared with others of the same kind: a small cap is
          never ranked against a large cap.
        </p>
        <KindList boards={boards} counts className="mt-4 md:hidden" />
        <div className="mt-[18px] hidden md:block">
          <KindTiles boards={boards} />
        </div>
        <Disclaimer className="mt-8">
          Not investment advice. MF Compass compares funds' past records.
          Direct, growth plans only. Data: AMFI and Kuvera.
        </Disclaimer>
      </Page>
    </>
  );
}
