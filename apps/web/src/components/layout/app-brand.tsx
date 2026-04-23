type AppBrandProps = {
  subtitle: string;
  variant?: 'light' | 'dark';
};

export function AppBrand({ subtitle, variant = 'light' }: AppBrandProps) {
  const isDark = variant === 'dark';
  return (
    <div className="flex items-center gap-var(--space-4)">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 border border-white/10 shadow-luxe group relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative text-[10px] font-black tracking-widest text-white/80">SB</span>
      </div>
      <div>
        <p
          className={`text-sm font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          SuperBoard
        </p>
        <p
          className={`mt-1 text-[8px] font-bold tracking-[0.3em] uppercase border-l border-brand-500 pl-2 ${isDark ? 'text-white/30' : 'text-slate-500'}`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
