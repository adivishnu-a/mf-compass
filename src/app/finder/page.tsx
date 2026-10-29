import type { Metadata } from "next";
import { Finder } from "@/components/Finder";
import { Page } from "@/components/Page";

export const metadata: Metadata = {
  title: "Fund finder",
  description:
    "Three questions about time, temperament and goal, and the kinds of mutual fund that may fit. Education, not advice.",
};

export default function FinderPage() {
  return (
    <Page className="md:px-8 md:pt-10 md:pb-16">
      <Finder />
    </Page>
  );
}
