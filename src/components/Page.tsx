"use client";
import { ViewTransition } from "react";
import { useWide } from "@/components/Shared";

const TYPES = {
  "nav-forward": "page-forward",
  "nav-back": "page-back",
  default: "page-fade",
};

/**
 * Wraps each page's content so route changes animate on a laptop: forward links slide in from the right, back
 * links from the left, everything else fades up, under a header that stays put. On a phone the page takes no
 * part of its own: the whole screen moves as one (globals.css, "Phone transitions").
 */
export function Page({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const wide = useWide();
  return (
    <ViewTransition
      enter={wide === false ? "none" : TYPES}
      exit={wide === false ? "none" : TYPES}
      default="none"
    >
      <div className={className}>{children}</div>
    </ViewTransition>
  );
}

export const Disclaimer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-[13px] text-text-3 ${className ?? ""}`}>{children}</p>
);
