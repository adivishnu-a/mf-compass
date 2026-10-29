import type { Metadata } from "next";
import { Page } from "@/components/Page";
import { PhoneTitleBar } from "@/components/PhoneBar";
import { SavedList } from "@/components/SavedList";

export const metadata: Metadata = {
  title: "Saved funds",
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <>
      <div className="md:hidden">
        <PhoneTitleBar title="Saved" />
      </div>
      <Page className="mx-auto max-w-[1280px] px-4 pt-1 pb-8 md:px-8 md:pt-8">
        <h1 className="hidden text-[34px] font-bold tracking-[-0.02em] md:block">
          Saved funds
        </h1>
        <SavedList />
      </Page>
    </>
  );
}
