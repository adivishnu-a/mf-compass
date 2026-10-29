"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-[560px] px-4 pt-16 md:pt-24">
      <h1 className="text-[28px] font-bold tracking-[-0.015em] md:text-[34px]">
        This page didn't load
      </h1>
      <p className="mt-2 text-text-2">
        We couldn't reach the fund data just now. It's usually brief. Try again,
        and if it keeps happening, come back in a few minutes.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="press h-11 rounded-[10px] bg-brand px-5 font-semibold text-on-brand hover:bg-brand-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="grid h-11 place-items-center rounded-[10px] border border-border-strong bg-surface px-5 font-semibold text-ink hover:text-ink"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
