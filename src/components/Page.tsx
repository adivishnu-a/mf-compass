import { ViewTransition } from "react";

const TYPES = {
  "nav-forward": "page-forward",
  "nav-back": "page-back",
  default: "page-fade",
};

/**
 * Wraps each page's content so route changes animate: forward links slide in from the right, back
 * links from the left, everything else fades up. The header and tab bar stay anchored.
 */
export function Page({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ViewTransition enter={TYPES} exit={TYPES} default="none">
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
