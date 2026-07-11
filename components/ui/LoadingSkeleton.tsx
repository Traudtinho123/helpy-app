import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
  lines?: number;
};

function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`skeleton-line-${index}`}
          className={cn(
            "h-3 rounded-[12px] bg-[#E2E8F0]/80",
            index === lines - 1 && "w-2/3"
          )}
        />
      ))}
    </div>
  );
}

function LoadingSkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[20px] border border-[#CBD5E1]/40 bg-white/90 p-5",
        className
      )}
    >
      <div className="mb-4 h-4 w-1/3 rounded-[12px] bg-[#E2E8F0]/80" />
      <LoadingSkeleton lines={4} />
    </div>
  );
}

export { LoadingSkeleton, LoadingSkeletonCard };
