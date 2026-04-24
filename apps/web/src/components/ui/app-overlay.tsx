'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface AppOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'slide-over' | 'modal';
  maxWidth?: string;
  showCloseButton?: boolean;
}

export function AppOverlay({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'slide-over',
  maxWidth = '3xl',
  showCloseButton = true,
}: AppOverlayProps) {
  // Handle Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isSlideOver = variant === 'slide-over';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Panel */}
          <motion.div
            initial={isSlideOver ? { x: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={isSlideOver ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isSlideOver ? { x: '100%' } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              relative z-10 flex flex-col bg-slate-950/95 border-white/5 shadow-glass backdrop-blur-3xl overflow-hidden
              ${isSlideOver ? 'h-full ml-auto border-l' : 'max-h-[90vh] rounded-xl border shadow-luxe w-full mx-4'}
              ${maxWidth === '3xl' ? 'max-w-3xl' : maxWidth === 'xl' ? 'max-w-xl' : maxWidth === 'lg' ? 'max-w-lg' : 'max-w-4xl'}
            `}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <header className="flex items-center justify-between border-b border-white/5 px-8 py-6 bg-white/[0.01]">
                {title && (
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center text-white/10 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10"
                  >
                    <X size={20} />
                  </button>
                )}
              </header>
            )}

            {/* Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-8">{children}</main>

            {/* Footer */}
            {footer && (
              <footer className="border-t border-white/5 bg-white/[0.02] px-8 py-6 backdrop-blur-xl">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
