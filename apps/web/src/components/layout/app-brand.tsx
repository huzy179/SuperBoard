type AppBrandProps = {
  subtitle: string;
  variant?: 'light' | 'dark';
};

export function AppBrand({ subtitle, variant = 'light' }: AppBrandProps) {
  const isDark = variant === 'dark';
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 shadow-luxe group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative text-[11px] font-black tracking-[0.2em] text-white">SB</span>
      </div>
      <div>
        <p
          className={`text-[16px] font-black tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          SuperBoard
        </p>
        <p
          className={`mt-1.5 text-[9px] font-black tracking-[0.25em] uppercase border-l-2 border-brand-500 pl-2 ${isDark ? 'text-white/40' : 'text-slate-500'}`}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
