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
    <div
      className="grid gap-[var(--space-6)] sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="rounded-lg border border-surface-border bg-surface-card p-[var(--space-6)] shadow-sm"
        >
          <div className="h-3 w-2/3 rounded bg-black/[0.06]" />
          <div className="mt-4 h-2 w-full rounded bg-black/[0.04]" />
          <div className="mt-2 h-2 w-5/6 rounded bg-black/[0.04]" />
          <div className="mt-6 h-2 w-1/4 rounded bg-brand-500/15" />
        </div>
      ))}
    </div>
  );
}

export function SectionError({ title, message, actionLabel, onAction }: SectionErrorProps) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-[var(--space-5)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-rose-700">{title}</p>
          <p className="text-sm text-rose-700/90 leading-relaxed">{message}</p>
        </div>
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="shrink-0 btn btn-primary">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
