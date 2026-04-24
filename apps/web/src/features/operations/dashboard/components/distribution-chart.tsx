'use client';

import { Cpu } from 'lucide-react';

interface ChartItem {
  key: string;
  label: string;
  value: number;
  colorClass: string;
}

interface DonutDistributionChartProps {
  items: ChartItem[];
  total: number;
  emptyMessage: string;
}

export function DonutDistributionChart({
  items,
  total,
  emptyMessage,
}: DonutDistributionChartProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  if (items.length === 0 || total === 0) {
    return (
      <div className="py-var(--space-12) flex flex-col items-center justify-center border border-dashed border-white/10 rounded-md bg-white/[0.01]">
        <Cpu size={24} className="mb-var(--space-4) text-white/10" />
        <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
          {emptyMessage}
        </p>
      </div>
    );
  }

  let currentOffset = 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-var(--space-10) items-center">
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-40 w-40 -rotate-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.02)]"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-white/[0.03]"
          />
          {items.map((item) => {
            const segmentLength = (item.value / total) * circumference;
            const dashOffset = -currentOffset;
            currentOffset += segmentLength;

            return (
              <circle
                key={item.key}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="butt"
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                className={`${item.colorClass} transition-all duration-1000 ease-out opacity-80 hover:opacity-100`}
                style={{
                  filter: `drop-shadow(0 0 4px currentColor)`,
                  strokeDashoffset: dashOffset,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white tracking-tighter leading-none animate-in fade-in zoom-in duration-1000">
            {total}
          </span>
          <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] mt-1">
            Active Nodes
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div
              key={item.key}
              className="group/legend flex items-center justify-between px-var(--space-4) py-var(--space-3) bg-white/[0.01] border border-white/5 rounded-sm hover:border-white/20 transition-all hover:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-1 w-3 rounded-full transition-all group-hover/legend:w-4 ${item.colorClass.replace('text-', 'bg-')} opacity-60 group-hover/legend:opacity-100`}
                />
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest group-hover/legend:text-white transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-black text-white tracking-tight">
                  {item.value} Units
                </span>
                <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest">
                  {percent}% Weight
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
