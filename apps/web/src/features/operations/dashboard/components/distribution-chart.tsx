'use client';

import { useMemo } from 'react';
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

  const segments = useMemo(() => {
    const result: (ChartItem & { segmentLength: number; dashOffset: number })[] = [];
    let offset = 0;
    items.forEach((item) => {
      const segmentLength = (item.value / total) * circumference;
      const dashOffset = -offset;
      result.push({
        ...item,
        segmentLength,
        dashOffset,
      });
      offset += segmentLength;
    });
    return result;
  }, [items, total, circumference]);

  if (items.length === 0 || total === 0) {
    return (
      <div className="py-[var(--space-12)] flex flex-col items-center justify-center border border-dashed border-surface-border rounded-lg bg-black/[0.02]">
        <Cpu size={24} className="mb-[var(--space-4)] text-[color:var(--color-faint)]" />
        <p className="text-sm font-medium text-[color:var(--color-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-[var(--space-10)] items-center">
      <div className="relative flex justify-center">
        <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-black/[0.06]"
          />
          {segments.map((item) => {
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
                strokeDasharray={`${item.segmentLength} ${circumference}`}
                strokeDashoffset={item.dashOffset}
                className={`${item.colorClass} opacity-90`}
                style={{
                  strokeDashoffset: item.dashOffset,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-[color:var(--color-ink)] tracking-tight leading-none">
            {total}
          </span>
          <span className="text-xs font-medium text-[color:var(--color-muted)] mt-1">Total</span>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const percent = Math.round((item.value / total) * 100);
          return (
            <div
              key={item.key}
              className="group/legend flex items-center justify-between px-[var(--space-4)] py-[var(--space-3)] bg-surface-card border border-surface-border rounded-lg hover:bg-black/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${item.colorClass.replace('text-', 'bg-')}`}
                />
                <span className="text-sm font-medium text-[color:var(--color-ink)]">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-semibold text-[color:var(--color-ink)] tabular-nums">
                  {item.value}
                </span>
                <span className="text-xs text-[color:var(--color-muted)] tabular-nums">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
