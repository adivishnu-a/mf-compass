/**
 * One icon per kind of fund, on a 32 grid. Equity kinds share a skyline of a small, a mid and a large
 * company; the sizes a fund buys are filled in peacock. Hybrids show the mix: shares in peacock,
 * bonds in outline, gold in marigold. Decorative: the label next to it carries the meaning.
 */
const ON = { fill: "var(--brand)", stroke: "var(--brand)" };
const OFF = { fill: "none", stroke: "var(--cat-line)" };
const line = {
  strokeWidth: 1.6,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

function Skyline({
  on,
  bead,
}: {
  on: [boolean, boolean, boolean];
  bead?: boolean;
}) {
  const blocks = [
    { x: 4.5, y: 19, h: 8 },
    { x: 12.75, y: 13, h: 14 },
    { x: 21, y: 6, h: 21 },
  ];
  return (
    <>
      {blocks.map((b, i) => (
        <g key={i}>
          <rect
            x={b.x}
            y={b.y}
            width={6.5}
            height={b.h}
            rx={1.2}
            {...(on[i] ? ON : OFF)}
            {...line}
          />
          {/* Windows, one row every 4.5 units, so the bars read as buildings rather than a chart. */}
          {Array.from({ length: Math.floor((b.h - 3) / 4.5) }, (_, r) => (
            <path
              key={r}
              d={`M${b.x + 2.2} ${b.y + 3.4 + r * 4.5}h2.1`}
              stroke={on[i] ? "var(--surface)" : "var(--cat-line)"}
              strokeWidth={1.4}
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}
      <path d="M2.5 27.2h27" stroke="var(--cat-line)" {...line} />
      {bead && (
        <circle
          cx={7.75}
          cy={12}
          r={2.6}
          fill="var(--marigold)"
          stroke="var(--brand)"
          strokeWidth={1.4}
        />
      )}
    </>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  "large-cap": <Skyline on={[false, false, true]} />,
  "mid-cap": <Skyline on={[false, true, false]} />,
  "small-cap": <Skyline on={[true, false, false]} />,
  "large-and-mid-cap": <Skyline on={[false, true, true]} />,
  "multi-cap": <Skyline on={[true, true, true]} />,
  // The manager can buy any size: none fixed, the bead is free to move.
  "flexi-cap": <Skyline on={[false, false, false]} bead />,
  // Mostly shares, some bonds.
  "aggressive-hybrid": (
    <>
      <circle
        cx={16}
        cy={16}
        r={10}
        fill="none"
        stroke="var(--cat-line)"
        strokeWidth={5}
      />
      <circle
        cx={16}
        cy={16}
        r={10}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={5}
        strokeDasharray="47.1 62.83"
        transform="rotate(-90 16 16)"
      />
    </>
  ),
  // Leans between shares and bonds as markets change.
  "balanced-advantage": (
    <>
      <g transform="rotate(-9 16 20)">
        <path d="M3 20h26" stroke="var(--brand)" {...line} strokeWidth={1.8} />
        <rect
          x={5}
          y={12.5}
          width={8}
          height={7.5}
          rx={1.2}
          {...ON}
          {...line}
        />
        <rect
          x={20.5}
          y={14.5}
          width={6.5}
          height={5.5}
          rx={1.2}
          {...OFF}
          {...line}
        />
      </g>
      <path d="M12.5 27.2 16 20.6l3.5 6.6Z" {...OFF} {...line} />
    </>
  ),
  // Shares, bonds and gold, stacked.
  "multi-asset": (
    <>
      <rect x={6} y={20.5} width={20} height={6} rx={2} {...ON} {...line} />
      <rect x={7.5} y={13.5} width={17} height={6} rx={2} {...OFF} {...line} />
      <rect
        x={9}
        y={6.5}
        width={14}
        height={6}
        rx={2}
        fill="var(--marigold)"
        stroke="var(--marigold)"
        {...line}
      />
    </>
  ),
};

export function KindIcon({
  slug,
  size = 32,
  className,
}: {
  slug: string;
  size?: number;
  className?: string;
}) {
  const icon = ICONS[slug];
  if (!icon) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      {icon}
    </svg>
  );
}
