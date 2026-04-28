type AppBrandProps = {
  subtitle: string;
  variant?: 'light' | 'dark';
};

export function AppBrand({ subtitle, variant = 'light' }: AppBrandProps) {
  const isDark = variant === 'dark';
  return (
    <div className="flex items-center gap-[var(--space-4)]">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-md border shadow-sm ${
          isDark
            ? 'bg-slate-900 border-white/10 text-white'
            : 'bg-surface-card border-surface-border text-[color:var(--color-ink)]'
        }`}
      >
        <span className="text-[11px] font-semibold">SB</span>
      </div>
      <div>
        <p
          className={`text-sm font-semibold tracking-tight leading-none ${
            isDark ? 'text-white' : 'text-[color:var(--color-ink)]'
          }`}
        >
          SuperBoard
        </p>
        <p
          className={`mt-1 text-xs font-medium border-l border-brand-500 pl-2 ${
            isDark ? 'text-white/50' : 'text-[color:var(--color-muted)]'
          }`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
