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
      <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
        <Cpu size={32} className="mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">{emptyMessage}</p>
      </div>
    );
  }

  let currentOffset = 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-center">
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 100 100"
          className="h-48 w-48 -rotate-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-white/[0.02]"
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
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                className={`${item.colorClass} transition-all duration-1000 ease-out`}
                style={{
                  filter: `drop-shadow(0 0 8px currentColor)`,
                  strokeDashoffset: dashOffset,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white tracking-tighter leading-none animate-in fade-in zoom-in duration-1000">
            {total}
          </span>
          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">
            Active Nodes
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div
              key={item.key}
              className="group/legend flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-all hover:bg-white/[0.04]"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-2 w-2 rounded-full shadow-glow-current transition-transform group-hover/legend:scale-150 ${item.colorClass.replace('text-', 'bg-')}`}
                />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover/legend:text-white transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-black text-white tracking-tight">
                  {item.value} Units
                </span>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
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
