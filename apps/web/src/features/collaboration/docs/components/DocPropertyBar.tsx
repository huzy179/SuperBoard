'use client';

import { Globe, Lock, Shield, Zap } from 'lucide-react';

interface DocPropertyBarProps {
  classification: 'TOP_SECRET' | 'INTERNAL' | 'PUBLIC';
  status: 'DRAFT' | 'REVIEW' | 'ACTIVE';
  ownerName: string;
}

function classificationMeta(classification: DocPropertyBarProps['classification']) {
  if (classification === 'TOP_SECRET')
    return {
      icon: <Lock size={14} />,
      label: 'Top secret',
      cls: 'bg-rose-50 border-rose-200 text-rose-700',
    };
  if (classification === 'INTERNAL')
    return {
      icon: <Shield size={14} />,
      label: 'Internal',
      cls: 'bg-brand-50 border-brand-500/20 text-brand-700',
    };
  return {
    icon: <Globe size={14} />,
    label: 'Public',
    cls: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
}

export function DocPropertyBar({ classification, status, ownerName }: DocPropertyBarProps) {
  const meta = classificationMeta(classification);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-surface-border bg-[color:var(--color-surface-alt)]/45 px-4 py-3">
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.cls}`}
      >
        {meta.icon}
        {meta.label}
      </span>

      <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface-bg px-3 py-1 text-xs font-semibold text-[color:var(--color-muted)]">
        <Zap size={14} className="text-[color:var(--color-faint)]" />
        {status}
      </span>

      <span className="ml-auto text-xs text-[color:var(--color-muted)]">
        Owner: <span className="font-semibold text-[color:var(--color-ink)]">{ownerName}</span>
      </span>
    </div>
  );
}
