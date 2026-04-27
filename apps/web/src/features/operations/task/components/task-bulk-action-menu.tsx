'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

type TaskBulkActionMenuProps = {
  isOpen: boolean;
  label: string;
  icon: ReactNode;
  widthClass: string;
  accentClass: string;
  onToggle: () => void;
  children: ReactNode;
};

export function TaskBulkActionMenu({
  isOpen,
  label,
  icon,
  widthClass,
  accentClass,
  onToggle,
  children,
}: TaskBulkActionMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`h-12 px-6 rounded-[1.5rem] flex items-center gap-4 transition-all duration-500 border ${
          isOpen
            ? 'bg-white border-white text-slate-950 shadow-luxe scale-105'
            : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/5'
        }`}
      >
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{label}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: -12 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`absolute bottom-full left-0 mb-6 rounded-[2.5rem] border border-white/10 bg-slate-950/90 p-3 ${widthClass} backdrop-blur-3xl shadow-luxe z-50 overflow-hidden`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${accentClass} to-transparent`}
            />
            <div className="space-y-1.5 p-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
