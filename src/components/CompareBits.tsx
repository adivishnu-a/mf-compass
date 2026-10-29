"use client";
import { useEffect } from "react";
import Link from "next/link";
import { CloseIcon, PlusIcon, ShareIcon } from "@/components/icons";
import { openPicker } from "@/components/SearchOverlay";
import { useLookup } from "@/components/useLookup";
import { COMPARE_MAX, usePicks } from "@/lib/picks";
import { cn } from "@/lib/utils";

/** "+ Add a fund": opens the picker, suggesting funds of the same kind first. */
export function AddFund({
  codes,
  category,
  variant,
}: {
  codes: string[];
  category?: string;
  variant: "column" | "bar" | "button";
}) {
  if (codes.length >= COMPARE_MAX) return null;
  const open = (e: React.MouseEvent<HTMLElement>) =>
    openPicker(codes, { category, from: e.currentTarget });
  if (variant === "column")
    return (
      <button
        type="button"
        onClick={open}
        className="h-[92px] w-full rounded-[14px] border-2 border-dashed border-border-strong bg-surface-2 text-[15px] font-semibold text-brand hover:border-brand hover:bg-brand-soft"
      >
        + Add a fund
      </button>
    );
  if (variant === "bar")
    return (
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] md:hidden"
        style={{ viewTransitionName: "tab-bar" }}
      >
        <button
          type="button"
          onClick={open}
          className="h-12 w-full rounded-xl border border-dashed border-brand bg-surface text-base font-bold text-brand"
        >
          + Add a {["", "", "third", "fourth"][codes.length] || "another"} fund
        </button>
      </div>
    );
  return (
    <button
      type="button"
      onClick={open}
      className="flex h-11 items-center gap-2 rounded-[10px] border border-dashed border-brand px-4 font-semibold text-brand hover:bg-brand-soft"
    >
      <PlusIcon size={16} /> Add a fund
    </button>
  );
}

export function SwapButton({
  codes,
  code,
  name,
  category,
}: {
  codes: string[];
  code: string;
  name: string;
  category: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) =>
        openPicker(codes, { replace: code, category, from: e.currentTarget })
      }
      aria-label={`Swap ${name} for another fund`}
      className="h-8 rounded-lg border border-border bg-surface px-2.5 text-[13px] font-semibold text-brand hover:border-brand"
    >
      Swap
    </button>
  );
}

export function RemoveLink({
  href,
  name,
  className,
}: {
  href: string;
  name: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={`Remove ${name} from the comparison`}
      className={cn(
        "grid size-8 place-items-center rounded-lg text-text-3 hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      <CloseIcon size={16} />
    </Link>
  );
}

export function ShareButton() {
  return (
    <button
      type="button"
      aria-label="Share this comparison"
      onClick={async () => {
        try {
          if (navigator.share)
            await navigator.share({
              title: document.title,
              url: location.href,
            });
          else await navigator.clipboard.writeText(location.href);
        } catch {}
      }}
      className="grid size-11 place-items-center rounded-xl text-ink"
    >
      <ShareIcon />
    </button>
  );
}

/** Keeps the tray in step with the funds the address lists. Render it only when the address lists some. */
export function SyncPicks({ codes }: { codes: string[] }) {
  const picks = usePicks("compare");
  const key = codes.join(",");
  useEffect(() => {
    if (key) picks.set(key.split(","));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/** /compare with nothing chosen: the tray's picks, or how to pick. */
export function CompareStart() {
  const picks = usePicks("compare");
  const { funds } = useLookup(picks.codes.length > 0);
  const names = picks.codes.map(
    (c) => funds?.find((f) => f.code === c)?.name ?? "…",
  );
  if (picks.codes.length >= 2)
    return (
      <Link
        href={`/compare?funds=${picks.codes.map(encodeURIComponent).join(",")}`}
        transitionTypes={["nav-forward"]}
        className="press mt-6 block max-w-[560px] rounded-[18px] bg-brand-soft p-5 text-brand-ink hover:text-brand-ink"
      >
        <strong className="text-lg">
          Compare your {picks.codes.length} picked funds
        </strong>
        <span className="mt-1 block text-[15px]">{names.join(" · ")}</span>
      </Link>
    );
  return (
    <div className="mt-6 max-w-[560px] rounded-[18px] border border-border bg-surface p-5">
      <p className="font-semibold">
        {picks.codes.length === 1
          ? `${names[0]} is picked. Pick one more.`
          : "Pick two to four funds to see them side by side."}
      </p>
      <p className="mt-1 text-[15px] text-text-2">
        Tick funds in any ranking, or tap{" "}
        <strong className="text-ink">Compare with another</strong> on a fund's
        page. Or start here:
      </p>
      <div className="mt-4">
        <AddFund codes={picks.codes} variant="button" />
      </div>
    </div>
  );
}
