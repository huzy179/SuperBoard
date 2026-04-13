'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AdaptiveWidgetProps {
  order: number;
  focus?: boolean;
  children: ReactNode;
  className?: string;
}

export function AdaptiveWidget({ order, focus, children, className }: AdaptiveWidgetProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: focus ? 1.02 : 1,
      }}
      transition={{
        duration: 0.8,
        delay: order * 0.1,
        layout: { type: 'spring', stiffness: 200, damping: 25 },
      }}
      className={`relative h-full ${focus ? 'z-10 shadow-glow-indigo/10 border-indigo-500/20' : ''} ${className}`}
    >
      {focus && (
        <>
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur opacity-40 rounded-[2.5rem] animate-pulse pointer-events-none" />
          <div className="absolute top-4 right-8 flex items-center gap-2">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">
              AI_FOCUS_ACTIVE
            </span>
            <div className="h-1 w-1 bg-indigo-500 rounded-full animate-ping" />
          </div>
        </>
      )}
      {children}
    </motion.div>
  );
}
