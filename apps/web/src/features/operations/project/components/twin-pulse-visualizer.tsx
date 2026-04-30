'use client';

import { useMemo } from 'react';

interface PulseData {
  healthScore: number;
  velocity: number;
  atRiskCount: number;
}

export function TwinPulseVisualizer({ data }: { data: PulseData }) {
  const normalizedHealth = data.healthScore / 100;

  // Generate orbital paths for "Missions"
  const orbits = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      radius: 60 + i * 25,
      opacity: 0.1 + (1 - i / 8) * 0.2,
    }));
  }, []);

  const nodes = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({ i })), []);

  const color = normalizedHealth > 0.8 ? '#10b981' : normalizedHealth > 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-black/[0.02]">
      <svg viewBox="0 0 400 400" className="w-[80%] h-[80%]">
        {/* Core */}
        <circle cx="200" cy="200" r="40" fill={color} opacity={0.9} />
        <circle
          cx="200"
          cy="200"
          r="54"
          fill="none"
          stroke={color}
          strokeOpacity={0.25}
          strokeWidth="2"
        />

        {/* Orbits */}
        {orbits.map((orbit, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={orbit.radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity={orbit.opacity}
            strokeDasharray="4 8"
            className="text-[color:var(--color-muted)]"
          />
        ))}

        {/* Nodes (static, reduced motion) */}
        {nodes.map(({ i }) => {
          const orbitIndex = i % orbits.length;
          const orbit = orbits[orbitIndex];
          if (!orbit) return null;

          const angle = (i / nodes.length) * Math.PI * 2;
          const x = 200 + Math.cos(angle) * orbit.radius;
          const y = 200 + Math.sin(angle) * orbit.radius;
          const isAtRisk = i < data.atRiskCount;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={4}
                fill={isAtRisk ? '#ef4444' : 'currentColor'}
                fillOpacity={isAtRisk ? 0.8 : 0.45}
                className={isAtRisk ? undefined : 'text-[color:var(--color-muted)]'}
              />
              {isAtRisk ? (
                <circle
                  cx={x}
                  cy={y}
                  r={10}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeOpacity={0.25}
                />
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Center Label */}
      <div className="absolute flex flex-col items-center pointer-events-none">
        <span className="text-5xl font-semibold text-[color:var(--color-ink)] tabular-nums tracking-tight">
          {data.healthScore}%
        </span>
        <span className="text-xs font-medium text-[color:var(--color-muted)]">Health</span>
      </div>
    </div>
  );
}
