import { FUND_CATEGORIES, type FundCategory } from "@/lib/kuvera/categories";

export interface CategoryInfo {
  /** Exact Kuvera category string stored in the database. */
  name: FundCategory;
  slug: string;
  /** Short label: "Mid cap". */
  label: string;
  /** In a sentence: "mid cap funds". */
  plural: string;
  /** In a sentence about one peer: "the average mid cap". */
  peer: string;
  /** Short plural for ranks: "Best of 29 mid caps". */
  short: string;
  /** One-line description for compact lists. */
  brief: string;
  /** What SEBI's rules make the fund hold, in plain words (home tiles). */
  line: string;
  /** Opening sentence of the category's ranking page. */
  intro: string;
  group: "equity" | "hybrid";
}

const INFO: Record<FundCategory, Omit<CategoryInfo, "name">> = {
  "Large Cap Fund": {
    slug: "large-cap",
    short: "large caps",
    brief: "India's 100 biggest companies",
    label: "Large cap",
    plural: "large cap funds",
    peer: "the average large cap",
    line: "India's 100 biggest companies. The steadiest kind of equity fund.",
    intro: "Funds that mostly own India's 100 largest companies.",
    group: "equity",
  },
  "Mid Cap Fund": {
    slug: "mid-cap",
    short: "mid caps",
    brief: "Companies ranked 101 to 250",
    label: "Mid cap",
    plural: "mid cap funds",
    peer: "the average mid cap",
    line: "Companies ranked 101 to 250. More growth, bigger swings.",
    intro: "Funds that mostly own India's 101st to 250th largest companies.",
    group: "equity",
  },
  "Small Cap Fund": {
    slug: "small-cap",
    short: "small caps",
    brief: "Smaller companies, biggest swings",
    label: "Small cap",
    plural: "small cap funds",
    peer: "the average small cap",
    line: "Smaller companies. The biggest swings; for 7 years or more.",
    intro: "Funds that mostly own companies smaller than India's 250 largest.",
    group: "equity",
  },
  "Flexi Cap Fund": {
    slug: "flexi-cap",
    short: "flexi caps",
    brief: "Any size, manager’s call",
    label: "Flexi cap",
    plural: "flexi cap funds",
    peer: "the average flexi cap",
    line: "Any company size, at the manager’s call.",
    intro:
      "Funds that own companies of any size, in whatever mix the manager chooses.",
    group: "equity",
  },
  "Multi Cap Fund": {
    slug: "multi-cap",
    short: "multi caps",
    brief: "A quarter each in large, mid, small",
    label: "Multi cap",
    plural: "multi cap funds",
    peer: "the average multi cap",
    line: "At least a quarter each in large, mid and small companies.",
    intro:
      "Funds that keep at least a quarter each in large, mid and small companies.",
    group: "equity",
  },
  "Large & Mid Cap fund": {
    slug: "large-and-mid-cap",
    short: "large & mid caps",
    brief: "35% each in large and mid",
    label: "Large & mid cap",
    plural: "large & mid cap funds",
    peer: "the average large & mid cap",
    line: "At least 35% each in large and mid companies.",
    intro:
      "Funds that keep at least 35% each in large and in mid-sized companies.",
    group: "equity",
  },
  "Dynamic Asset Allocation or Balanced Advantage": {
    slug: "balanced-advantage",
    short: "balanced advantage funds",
    brief: "Shifts between shares and bonds",
    label: "Balanced advantage",
    plural: "balanced advantage funds",
    peer: "the average balanced advantage fund",
    line: "Moves between shares and bonds as markets change.",
    intro: "Funds that move money between shares and bonds as markets change.",
    group: "hybrid",
  },
  "Aggressive Hybrid Fund": {
    slug: "aggressive-hybrid",
    short: "aggressive hybrids",
    brief: "Mostly shares, some bonds",
    label: "Aggressive hybrid",
    plural: "aggressive hybrid funds",
    peer: "the average aggressive hybrid",
    line: "Mostly shares, with some bonds to soften falls.",
    intro: "Funds that keep 65–80% in shares and the rest in bonds.",
    group: "hybrid",
  },
  "Multi Asset Allocation": {
    slug: "multi-asset",
    short: "multi asset funds",
    brief: "Shares, bonds and gold",
    label: "Multi asset",
    plural: "multi asset funds",
    peer: "the average multi asset fund",
    line: "Shares, bonds and gold in one fund.",
    intro:
      "Funds that hold at least three kinds of asset, such as shares, bonds and gold.",
    group: "hybrid",
  },
};

export const CATEGORIES: CategoryInfo[] = FUND_CATEGORIES.map((name) => ({
  name,
  ...INFO[name],
}));

export const categoryByName = (name: string | null | undefined) =>
  CATEGORIES.find((c) => c.name === name) ?? null;

export const categoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug) ?? null;
