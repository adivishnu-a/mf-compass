export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[1280px] px-4 pt-[calc(16px+env(safe-area-inset-top))] md:px-8 md:pt-6"
      aria-busy="true"
      aria-label="Loading fund"
    >
      <div className="mfc-skeleton hidden h-4 w-48 md:block" />
      <div className="mt-3.5 flex items-center gap-4 md:gap-6">
        <div className="mfc-skeleton size-[52px] rounded-[13px] md:size-16 md:rounded-2xl" />
        <div className="flex-1">
          <div className="mfc-skeleton h-7 w-64 max-w-full md:h-9" />
          <div className="mfc-skeleton mt-2 h-4 w-80 max-w-full" />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-6">
        <div className="grid flex-[999_1_720px] gap-6">
          <div className="mfc-skeleton h-56 rounded-[18px]" />
          <div className="mfc-skeleton h-80 rounded-[18px]" />
        </div>
        <div className="mfc-skeleton hidden h-96 flex-[1_1_320px] rounded-[18px] md:block" />
      </div>
    </div>
  );
}
