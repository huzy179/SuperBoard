'use client';

export function ProjectSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-700">
      {/* Header Skeleton */}
      <div className="h-48 w-full rounded-[3rem] bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-4 w-32 rounded-full bg-white/5 animate-pulse" />
          <div className="h-10 w-96 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-32 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-10 w-32 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-16 w-full rounded-[1.5rem] bg-slate-900/40 backdrop-blur-3xl border border-white/5" />

      {/* Board Skeleton */}
      <div className="flex gap-6 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[22rem] h-[600px] rounded-[2.5rem] bg-slate-900/40 backdrop-blur-3xl border border-white/5 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <div className="h-4 w-24 rounded-full bg-white/5 animate-pulse" />
              <div className="h-6 w-6 rounded-full bg-white/5 animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-32 w-full rounded-[2rem] bg-white/[0.02] border border-white/5 p-5 space-y-4"
                >
                  <div className="flex justify-between">
                    <div className="h-3 w-12 rounded-full bg-white/5 animate-pulse" />
                    <div className="h-3 w-8 rounded-full bg-white/5 animate-pulse" />
                  </div>
                  <div className="h-4 w-full rounded-full bg-white/5 animate-pulse" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-3 w-16 rounded-full bg-white/5 animate-pulse" />
                    <div className="h-5 w-5 rounded-full bg-white/5 animate-pulse" />
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
