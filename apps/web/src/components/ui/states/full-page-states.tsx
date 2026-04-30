type FullPageLoaderProps = {
  label: string;
};

type FullPageErrorProps = {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

type InlineLoaderProps = {
  label: string;
};

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <main className="min-h-screen bg-linear-to-br from-surface-bg via-white to-surface-bg">
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm font-medium text-[color:var(--color-muted)]">{label}</p>
        </div>
      </div>
    </main>
  );
}

export function FullPageError({ title, message, actionLabel, onAction }: FullPageErrorProps) {
  return (
    <main className="min-h-screen bg-linear-to-br from-surface-bg via-white to-surface-bg">
      <div className="flex h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-card p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <span className="text-xl">⚠️</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[color:var(--color-ink)]">{title}</h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">{message}</p>
          <button type="button" onClick={onAction} className="mt-6 w-full btn btn-primary">
            {actionLabel}
          </button>
        </div>
      </div>
    </main>
  );
}

export function InlineLoader({ label }: InlineLoaderProps) {
  return (
    <div className="flex justify-center py-12">
      <div className="space-y-2 text-center">
        <div className="inline-flex h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="text-sm text-[color:var(--color-muted)]">{label}</p>
      </div>
    </div>
  );
}

export function EmptyStateCard({
  icon = '📋',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-surface-border bg-surface-bg p-12 text-center">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="mt-4 font-medium text-[color:var(--color-ink)]">{title}</p>
      <p className="mt-1 text-sm text-[color:var(--color-muted)]">{description}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="mt-4 btn btn-primary">
          <span>+</span>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
