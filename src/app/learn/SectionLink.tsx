"use client";

/** A link to a section further down this page that glides there (a jump with reduced motion). */
export function SectionLink({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`#${id}`}
      className={className}
      onClick={(e) => {
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "start",
        });
        history.replaceState(history.state, "", `#${id}`);
      }}
    >
      {children}
    </a>
  );
}
