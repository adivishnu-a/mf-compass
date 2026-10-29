/** The compass mark: peacock tile, marigold needle pointing up-right. */
export function Mark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="#0A5878" />
      <polygon points="23.5,8.5 18.8,18.8 13.2,13.2" fill="#F0A202" />
      <polygon points="8.5,23.5 13.2,13.2 18.8,18.8" fill="#FFFFFF" />
    </svg>
  );
}
