import { cn } from "@/lib/utils";

/**
 * The Compass Score as a marigold bead ringed in peacock on a hairline, optionally among the category's
 * other rated funds (grey dots). Sizes follow the mocks: list 12/–, card 20/8, fund 24/10, compare 18/8.
 */
const SIZES = {
  xs: { bead: 12, ring: [2, 3.5], dot: 6, height: 16, inset: 6 },
  sm: { bead: 14, ring: [2, 3.5], dot: 6, height: 22, inset: 6 },
  md: { bead: 18, ring: [3, 5], dot: 8, height: 30, inset: 8 },
  lg: { bead: 20, ring: [3, 5], dot: 8, height: 36, inset: 10 },
  xl: { bead: 24, ring: [3, 5], dot: 10, height: 44, inset: 12 },
} as const;

export function ScoreStrip({
  score,
  peers,
  label,
  size = "xs",
  className,
  style,
  bead = true,
}: {
  bead?: boolean;
  score: number;
  peers?: number[];
  label: string;
  size?: keyof typeof SIZES;
  className?: string;
  style?: React.CSSProperties;
}) {
  const s = SIZES[size];
  const mid = s.height / 2;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn("relative block", className)}
      style={{ height: s.height, ...style }}
    >
      <span
        className="absolute inset-x-0 h-0.5 rounded-[1px] bg-track"
        style={{ top: mid - 1 }}
      />
      {peers?.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-peer"
          style={{
            left: `${p}%`,
            top: mid - s.dot / 2,
            width: s.dot,
            height: s.dot,
            marginLeft: -s.dot / 2,
          }}
        />
      ))}
      {bead && (
        <span
          className="mfc-bead absolute rounded-full bg-marigold"
          style={{
            left: `${score}%`,
            top: mid - s.bead / 2,
            width: s.bead,
            height: s.bead,
            marginLeft: -s.bead / 2,
            boxShadow: `0 0 0 ${s.ring[0]}px var(--surface), 0 0 0 ${s.ring[1]}px var(--brand)`,
          }}
        />
      )}
    </span>
  );
}
