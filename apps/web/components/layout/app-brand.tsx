type AppBrandProps = {
  subtitle: string;
  variant?: 'light' | 'dark';
};

export function AppBrand({ subtitle, variant = 'light' }: AppBrandProps) {
  const isDark = variant === 'dark';
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-brand-600 shadow-sm">
        <span className="text-[10px] font-bold tracking-[0.14em] text-white">SB</span>
      </div>
      <div>
        <p
          className={`text-sm font-semibold leading-none ${isDark ? 'text-white/90' : 'text-slate-900'}`}
        >
          SuperBoard
        </p>
        <p
          className={`mt-0.5 text-[10px] font-medium tracking-[0.08em] uppercase ${isDark ? 'text-white/40' : 'text-slate-500'}`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
