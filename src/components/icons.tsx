/** Authored icons, one 1.8 stroke on a 24 grid. Decorative: always aria-hidden. */

type P = { size?: number; className?: string };
const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className,
});

/** A slim crescent. Filled and stroked in the same colour with round joins, so the two tips are softened. */
export const MoonIcon = ({ size = 18, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M10.43 4.26A7.9 7.9 0 1 0 19.74 13.57A6.6 6.6 0 0 1 10.43 4.26Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);
export const SunIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="3.6" fill="currentColor" stroke="none" />
    <path d="M12 3.5v1.6M12 18.9v1.6M3.5 12h1.6M18.9 12h1.6M6 6l1.1 1.1M16.9 16.9 18 18M6 18l1.1-1.1M16.9 7.1 18 6" />
  </svg>
);
export const SearchIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const BackIcon = ({ size = 22, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M15 5 8 12l7 7" />
  </svg>
);
export const ChevronRight = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);
export const ChevronDown = ({ size = 16, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.2}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const ShareIcon = ({ size = 22, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" />
  </svg>
);
export const BookmarkIcon = ({
  size = 22,
  filled,
  className,
}: P & { filled?: boolean }) => (
  <svg {...base(size, className)} fill={filled ? "currentColor" : "none"}>
    <path d="M6 4h12v16l-6-4-6 4z" />
  </svg>
);
export const PlusIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const CheckIcon = ({ size = 16, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const CloseIcon = ({ size = 18, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const SortIcon = ({ size = 16, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);
export const ArrowRight = ({ size = 18, className }: P) => (
  <svg {...base(size, className)} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
