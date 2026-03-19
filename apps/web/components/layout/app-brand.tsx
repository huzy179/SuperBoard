type AppBrandProps = {
  subtitle: string;
};

export function AppBrand({ subtitle }: AppBrandProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-brand-200 bg-brand-700">
        <span className="text-xs font-bold tracking-[0.14em] text-white">SB</span>
      </div>
      <div>
        <p className="text-sm font-semibold leading-none text-slate-900">SuperBoard</p>
        <p className="mt-1 text-[11px] font-medium tracking-[0.08em] text-slate-500 uppercase">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
