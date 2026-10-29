"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/Mark";
import { BackIcon, SearchIcon } from "@/components/icons";
import { goBack } from "@/components/Transitions";
import { openSearch } from "@/components/SearchOverlay";
import { cn } from "@/lib/utils";

export function SearchButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openSearch}
      aria-label="Search funds"
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl bg-field text-ink",
        className,
      )}
    >
      <SearchIcon size={20} />
    </button>
  );
}

/** Back that returns to where the user came from, or to `fallback` when they landed here directly. */
export function BackButton({
  fallback,
  label,
}: {
  fallback: string;
  label: string;
}) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      transitionTypes={["nav-back"]}
      aria-label={label}
      onClick={(e) => {
        if (
          window.history.length > 1 &&
          document.referrer.startsWith(window.location.origin)
        ) {
          e.preventDefault();
          goBack(router.back);
        }
      }}
      className="grid size-11 shrink-0 place-items-center rounded-xl text-ink hover:bg-surface-2 hover:text-ink"
    >
      <BackIcon />
    </Link>
  );
}

/** Phone top bar for a tab page: mark, title, search (mock: phone rankings). */
export function PhoneTitleBar({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border bg-surface px-4 pt-[calc(14px+env(safe-area-inset-top))] pb-3 md:hidden">
      <div className="flex items-center gap-2.5">
        <Link href="/" aria-label="MF Compass home" className="shrink-0">
          <Mark size={28} />
        </Link>
        <h1 className="flex-1 truncate text-[22px] font-bold tracking-[-0.01em]">
          {title}
        </h1>
        <SearchButton />
      </div>
      {children}
    </header>
  );
}
