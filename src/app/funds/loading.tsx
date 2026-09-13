import { SkeletonTable } from "@/components/funds/SkeletonTable";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-9 w-72 max-w-full rounded-md bg-muted animate-pulse" />
      <div className="mt-2 h-4 w-96 max-w-full rounded-md bg-muted animate-pulse" />
      <div className="mt-8">
        <SkeletonTable />
      </div>
    </div>
  );
}
