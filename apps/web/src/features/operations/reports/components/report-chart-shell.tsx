import type { ReactNode } from 'react';

export const REPORT_AXIS_TICK = {
  fontSize: 9,
  fill: 'rgba(255,255,255,0.3)',
  fontWeight: 900,
} as const;

export const REPORT_GRID_PROPS = {
  vertical: false,
  stroke: 'rgba(255,255,255,0.03)',
} as const;

export const REPORT_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
  backdropFilter: 'blur(16px)',
  padding: '16px',
} as const;

export const REPORT_TOOLTIP_ITEM_STYLE = {
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
} as const;

export const REPORT_LEGEND_STYLE = {
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  paddingTop: '30px',
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
    <div className="flex flex-col bg-white/5 p-10 rounded-[3.5rem] border border-white/5 shadow-glass backdrop-blur-3xl group hover:border-white/10 transition-all min-h-[500px]">
      <div className="mb-10 space-y-2">
        <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">
          {title}
        </h3>
        <p className="text-[10px] font-bold text-white/20 tracking-wider uppercase leading-none">
          {description}
        </p>
      </div>
      <div className="flex-1 min-h-[300px]">{children}</div>
    </div>
  );
}
