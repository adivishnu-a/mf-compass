"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CloseIcon } from "@/components/icons";
import { useLookup } from "@/components/useLookup";
import { houseShort } from "@/lib/format";
import { COMPARE_MAX, compareHref, usePicks } from "@/lib/picks";
import { cn } from "@/lib/utils";

/** Floating tray once funds are picked (mock: rankings boards). Hidden on the compare page itself. */
export function CompareTray() {
  const path = usePathname();
  const picks = usePicks("compare");
  const { funds } = useLookup(picks.codes.length > 0);
  const show =
    picks.codes.length > 0 &&
    !["/compare", "/finder", "/learn", "/method"].some((p) =>
      path.startsWith(p),
    );
  const onFund = path.startsWith("/fund/");
  const names = picks.codes.map(
    (c) => funds?.find((f) => f.code === c)?.name ?? "",
  );
  const ready = picks.codes.length >= 2;
  // Pages pad their foot by --tray-room so the tray never covers the last lines. Phone fund pages hide it.
  useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      root.style.setProperty(
        "--tray-room",
        show && !(onFund && !matchMedia("(min-width: 768px)").matches)
          ? "80px"
          : "0px",
      );
    sync();
    addEventListener("resize", sync);
    return () => {
      removeEventListener("resize", sync);
      root.style.setProperty("--tray-room", "0px");
    };
  }, [show, onFund]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Compare tray"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className={cn(
            "fixed inset-x-3 bottom-[calc(92px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[720px] md:bottom-4 md:px-4",
            // A phone fund page has its own Save / Compare bar; two bars would compete.
            onFund && "max-md:hidden",
          )}
        >
          <div className="flex items-center gap-3 rounded-[14px] bg-tray py-2 pr-2 pl-4 text-on-tray shadow-float md:gap-4 md:py-3 md:pr-3 md:pl-5">
            <span className="shrink-0 font-semibold">
              <span className="md:hidden">{picks.codes.length} picked</span>
              <span className="hidden md:inline">
                {picks.codes.length} of {COMPARE_MAX} picked
              </span>
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px] text-on-tray-2">
              <span className="md:hidden">
                {names.filter(Boolean).map(houseShort).join(", ")}
              </span>
              <span className="hidden md:inline">
                {names.filter(Boolean).join(", ")}
              </span>
            </span>
            <button
              type="button"
              onClick={picks.clear}
              aria-label="Clear picked funds"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-on-tray-2 hover:text-on-tray"
            >
              <CloseIcon size={16} />
            </button>
            {ready ? (
              <Link
                href={compareHref(picks.codes)}
                transitionTypes={["nav-forward"]}
                className="press grid h-10 shrink-0 place-items-center rounded-[10px] bg-marigold px-4 font-bold text-[#13212A] hover:bg-[#F5B42A] hover:text-[#13212A]"
              >
                <span className="md:hidden">Compare</span>
                <span className="hidden md:inline">Compare side by side</span>
              </Link>
            ) : (
              <span className="shrink-0 pr-2 text-sm text-on-tray-2">
                Pick one more
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
