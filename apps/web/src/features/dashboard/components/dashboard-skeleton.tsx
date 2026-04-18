'use client';

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <div className="h-3 w-32 bg-white/5 rounded-full" />
          <div className="h-12 w-64 md:w-96 bg-white/5 rounded-2xl" />
        </div>
        <div className="h-10 w-10 bg-white/5 rounded-2xl" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-white/5 border border-white/5 rounded-[2.5rem]" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-96 bg-white/5 border border-white/5 rounded-[2.5rem]" />
        <div className="h-96 bg-white/5 border border-white/5 rounded-[2.5rem]" />
      </div>
    </div>
  );
}
