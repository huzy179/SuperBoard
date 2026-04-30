'use client';

export function ProjectSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-48 w-full rounded-card bg-black/[0.03] border border-surface-border p-10 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded-full bg-black/[0.04]" />
          <div className="h-10 w-96 rounded-full bg-black/[0.04]" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-32 rounded-lg bg-black/[0.04]" />
          <div className="h-10 w-32 rounded-lg bg-black/[0.04]" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-16 w-full rounded-lg bg-black/[0.03] border border-surface-border" />

      {/* Board Skeleton */}
      <div className="flex gap-6 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[22rem] h-[600px] rounded-card bg-black/[0.03] border border-surface-border flex flex-col"
          >
            <div className="p-6 border-b border-surface-border flex justify-between items-center">
              <div className="h-4 w-24 rounded-full bg-black/[0.04]" />
              <div className="h-6 w-6 rounded-full bg-black/[0.04]" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-32 w-full rounded-xl bg-surface-card border border-surface-border p-5 space-y-4"
                >
                  <div className="flex justify-between">
                    <div className="h-3 w-12 rounded-full bg-black/[0.04]" />
                    <div className="h-3 w-8 rounded-full bg-black/[0.04]" />
                  </div>
                  <div className="h-4 w-full rounded-full bg-black/[0.04]" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-3 w-16 rounded-full bg-black/[0.04]" />
                    <div className="h-5 w-5 rounded-full bg-black/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
