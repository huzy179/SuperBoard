import type { ReactNode } from 'react';

export const REPORT_AXIS_TICK = {
  fontSize: 9,
  fill: 'rgba(0,0,0,0.45)',
  fontWeight: 600,
} as const;

export const REPORT_GRID_PROPS = {
  vertical: false,
  stroke: 'rgba(0,0,0,0.06)',
} as const;

export const REPORT_TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid rgba(0,0,0,0.1)',
  boxShadow: '0 18px 40px -24px rgb(0 0 0 / 0.22)',
  padding: '12px 14px',
} as const;

export const REPORT_TOOLTIP_ITEM_STYLE = {
  fontSize: '10px',
  fontWeight: 600,
} as const;

export const REPORT_LEGEND_STYLE = {
  fontSize: '9px',
  fontWeight: 600,
  paddingTop: '16px',
} as const;

export function ReportChartShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[460px] flex-col rounded-xl border border-surface-border bg-surface-card p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h3 className="text-base font-semibold text-[color:var(--color-ink)]">{title}</h3>
        <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 min-h-[300px]">{children}</div>
    </div>
  );
}
