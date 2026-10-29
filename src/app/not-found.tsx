import Link from "next/link";
import { Page } from "@/components/Page";
import { SearchField } from "@/components/SearchField";

export default function NotFound() {
  return (
    <Page className="mx-auto max-w-[560px] px-4 pt-16 md:pt-24">
      <h1 className="text-[28px] font-bold tracking-[-0.015em] md:text-[34px]">
        We couldn't find that page
      </h1>
      <p className="mt-2 text-[15px] text-text-2 md:text-[17px]">
        The fund may have been merged or closed, or the link has a typo. Search
        for it, or browse by kind of fund.
      </p>
      <SearchField
        variant="hero"
        placeholder="Search a fund"
        className="mt-6"
      />
      <Link href="/funds" className="mt-4 inline-block font-semibold">
        Explore all funds
      </Link>
    </Page>
  );
}
