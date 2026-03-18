type AppBrandProps = {
  subtitle: string;
};

export function AppBrand({ subtitle }: AppBrandProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-brand-600 to-brand-700">
        <span className="text-lg font-bold text-white">⚙️</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">SuperBoard</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
