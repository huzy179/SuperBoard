'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface QuantumModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]',
};

export function QuantumModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: QuantumModalProps) {
  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Grain Texture Over Backdrop */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizeClasses[size]} overflow-hidden rounded-[2.5rem] border border-white/5 bg-slate-950/80 shadow-2xl backdrop-blur-3xl`}
          >
            {/* Rim Lighting */}
            <div className="absolute inset-0 rounded-[2.5rem] border border-brand-500/10 pointer-events-none" />

            {/* Interior Content */}
            <div className="relative z-10 p-8 sm:p-10">
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between mb-8">
                  {title && (
                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">
                      {title}
                    </h3>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="rounded-full p-2 text-white/40 hover:bg-white/5 hover:text-white transition-all active:scale-95"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">{children}</div>
            </div>

            {/* Accent Glow */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
