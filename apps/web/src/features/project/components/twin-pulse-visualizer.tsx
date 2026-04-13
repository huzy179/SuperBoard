'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

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
      duration: 10 + Math.random() * 20,
      delay: -i * 2,
      opacity: 0.1 + (1 - i / 8) * 0.2,
    }));
  }, []);

  const color = normalizedHealth > 0.8 ? '#10b981' : normalizedHealth > 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden">
      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-20 blur-[120px] transition-colors duration-1000"
        style={{ backgroundColor: color }}
      />

      <svg viewBox="0 0 400 400" className="w-[80%] h-[80%] drop-shadow-2xl">
        {/* Core Pulsar */}
        <motion.circle
          cx="200"
          cy="200"
          r="40"
          fill={color}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{
            scale: [0.8, 1.1, 0.8],
            opacity: [0.5, 0.8, 0.5],
            filter: [`blur(4px)`, `blur(12px)`, `blur(4px)`],
          }}
          transition={{
            duration: 3 / (data.velocity || 1),
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Orbits */}
        {orbits.map((orbit, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={orbit.radius}
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity={orbit.opacity}
            strokeDasharray="4 8"
          />
        ))}

        {/* Floating Missions (Represented as Nodes on Orbits) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const orbitIndex = i % orbits.length;
          const orbit = orbits[orbitIndex];

          return (
            <motion.g
              key={i}
              animate={{ rotate: 360 }}
              transition={{
                duration: orbit.duration,
                repeat: Infinity,
                ease: 'linear',
                delay: orbit.delay,
              }}
              style={{ originX: '200px', originY: '200px' }}
            >
              <circle
                cx={200 + orbit.radius}
                cy="200"
                r={3 + Math.random() * 3}
                fill={i < data.atRiskCount ? '#ef4444' : 'white'}
                fillOpacity={0.6}
              />
              {i < data.atRiskCount && (
                <motion.circle
                  cx={200 + orbit.radius}
                  cy="200"
                  r={8}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1"
                  animate={{ scale: [1, 2], opacity: [1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.g>
          );
        })}

        {/* Connecting Neural Lines */}
        <motion.path
          d="M 200 200 Q 250 150 300 200 T 400 200"
          fill="none"
          stroke="url(#pulseGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <defs>
          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Label */}
      <div className="absolute flex flex-col items-center pointer-events-none">
        <span className="text-5xl font-black text-white tabular-nums tracking-tighter shadow-sm">
          {data.healthScore}%
        </span>
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">
          Health Index
        </span>
      </div>
    </div>
  );
}
