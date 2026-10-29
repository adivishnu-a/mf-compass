"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

function initials(name: string | null) {
  const words = (name ?? "")
    .replace(/mutual\s*fund/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "MF";
  return (
    words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)
  ).toUpperCase();
}

/** The fund house's logo on white with a hairline edge (corner = a quarter of the size), or its initials. */
export function AmcLogo({
  houseCode,
  house,
  size = 32,
  className,
}: {
  houseCode: string | null;
  house: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(!houseCode);
  const style = {
    width: size,
    height: size,
    borderRadius: Math.round(size / 4),
  };
  if (failed)
    return (
      <span
        aria-hidden="true"
        className={cn(
          "grid shrink-0 place-items-center border border-hairline bg-brand-soft font-bold text-brand-ink",
          className,
        )}
        style={{ ...style, fontSize: size * 0.36 }}
      >
        {initials(house)}
      </span>
    );
  return (
    <img
      src={`/logos/amc/${houseCode}.webp`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 border border-hairline bg-white object-contain",
        className,
      )}
      style={style}
    />
  );
}
