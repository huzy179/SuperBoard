'use client';

import React, { useEffect } from 'react';
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSlideOver = variant === 'slide-over';
  const widthClass =
    maxWidth === '3xl'
      ? 'max-w-3xl'
      : maxWidth === 'xl'
        ? 'max-w-xl'
        : maxWidth === 'lg'
          ? 'max-w-lg'
          : 'max-w-4xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden />

      <div
        className={[
          'relative z-10 flex flex-col bg-surface-card border border-surface-border shadow-luxe overflow-hidden',
          isSlideOver
            ? `h-full ml-auto w-full ${widthClass} rounded-none border-l`
            : `max-h-[90vh] w-full mx-4 ${widthClass} rounded-xl`,
        ].join(' ')}
      >
        {(title || subtitle || showCloseButton) && (
          <header className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-4">
            <div className="min-w-0">
              {title ? (
                <h2 className="text-base font-semibold text-[color:var(--color-ink)] truncate">
                  {title}
                </h2>
              ) : null}
              {subtitle ? (
                <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {showCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            ) : null}
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-6">{children}</main>

        {footer ? (
          <footer className="border-t border-surface-border bg-surface-card px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
