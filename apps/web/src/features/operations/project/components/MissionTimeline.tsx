'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { getProjectChronology } from '../api/project-service';

interface TimelinePulse {
  id: string;
  date: string;
  intensity: number;
  narrative: string;
  events: {
    id: string;
    type: string;
    title: string;
    actor: string;
    time: string;
  }[];
}

export function MissionTimeline({ projectId }: { projectId: string }) {
  const [pulses, setPulses] = useState<TimelinePulse[]>([]);
  const [selectedPulse, setSelectedPulse] = useState<TimelinePulse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProjectChronology(projectId)
      .then((data) => {
        setPulses(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [projectId]);

  const scroll = (direction: 'left' | 'right') => {
    const node = scrollContainerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === 'left' ? -360 : 360,
      behavior: 'smooth',
    });
  };

  if (isLoading) return <TimelineSkeleton />;
  if (pulses.length === 0) return null;

  return (
    <section className="rounded-lg border border-surface-border bg-surface-card shadow-luxe p-[var(--space-6)]">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-500/15 flex items-center justify-center text-brand-500 shrink-0">
            <History size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[color:var(--color-ink)] truncate">Timeline</p>
            <p className="text-xs text-[color:var(--color-muted)] truncate">
              Nhật ký hoạt động gần đây theo ngày
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="h-9 w-9 rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} className="mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="h-9 w-9 rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} className="mx-auto" />
          </button>
        </div>
      </header>

      <div
        ref={scrollContainerRef}
        className="mt-5 flex gap-4 overflow-x-auto pb-2 elite-scrollbar"
      >
        {pulses.map((pulse, index) => (
          <button
            key={pulse.id}
            type="button"
            onClick={() => setSelectedPulse(pulse)}
            className={`shrink-0 text-left rounded-lg border px-4 py-3 transition-colors ${
              selectedPulse?.id === pulse.id
                ? 'bg-brand-50 border-brand-500/25'
                : 'bg-surface-bg border-surface-border hover:bg-black/[0.03]'
            }`}
            aria-label={`Select ${pulse.date}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[color:var(--color-ink)] truncate">
                  {pulse.date}
                </p>
                <p className="text-[11px] text-[color:var(--color-muted)] truncate">
                  {pulse.events.length} events
                </p>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${
                  pulse.intensity >= 0.66
                    ? 'bg-brand-500'
                    : pulse.intensity >= 0.33
                      ? 'bg-indigo-500'
                      : 'bg-slate-400'
                }`}
                aria-hidden
              />
            </div>

            {index < pulses.length - 1 ? (
              <div className="mt-3 h-px w-10 bg-surface-border" aria-hidden />
            ) : null}
          </button>
        ))}
      </div>

      {selectedPulse ? (
        <div className="mt-6 rounded-lg border border-surface-border bg-[color:var(--color-surface-alt)]/45 p-[var(--space-6)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                {selectedPulse.date}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
                {selectedPulse.narrative}
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center rounded-full border border-surface-border bg-surface-bg px-2.5 py-1 text-xs font-semibold text-[color:var(--color-muted)]">
              {selectedPulse.events.length} events
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {selectedPulse.events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-surface-border bg-surface-bg p-4"
              >
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">{event.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
                  <span className="font-semibold">{event.actor}</span>
                  <span className="h-1 w-1 rounded-full bg-surface-border" aria-hidden />
                  <span>{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TimelineSkeleton() {
  return (
    <section className="rounded-lg border border-surface-border bg-surface-card shadow-luxe p-[var(--space-6)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-black/[0.05]" />
          <div>
            <div className="h-3 w-24 bg-black/[0.05] rounded" />
            <div className="mt-2 h-3 w-40 bg-black/[0.05] rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-sm bg-black/[0.05]" />
          <div className="h-9 w-9 rounded-sm bg-black/[0.05]" />
        </div>
      </div>

      <div className="mt-5 flex gap-4 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-52 h-16 rounded-lg bg-black/[0.04]" />
        ))}
      </div>
    </section>
  );
}
