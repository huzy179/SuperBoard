'use client';

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
  onToggle,
  children,
}: TaskBulkActionMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`h-10 px-4 rounded-md flex items-center gap-3 transition-colors border ${
          isOpen
            ? 'bg-black/[0.04] border-surface-border text-[color:var(--color-ink)]'
            : 'bg-surface-card border-surface-border text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03]'
        }`}
      >
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </button>

      {isOpen ? (
        <div
          className={`absolute bottom-full left-0 mb-2 rounded-lg border border-surface-border bg-surface-card p-2 ${widthClass} shadow-luxe z-50`}
          role="menu"
        >
          <div className="space-y-1">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
