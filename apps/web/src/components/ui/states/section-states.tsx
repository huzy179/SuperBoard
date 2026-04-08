type SectionSkeletonProps = {
  rows?: number;
};

type SectionErrorProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionSkeleton({ rows = 3 }: SectionSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="overflow-hidden rounded-xl border border-surface-border bg-surface-card p-6"
        >
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-100" />
          <div className="mt-6 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function SectionError({ title, message, actionLabel, onAction }: SectionErrorProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-rose-900">{title}</p>
          <p className="mt-1 text-sm text-rose-700">{message}</p>
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
