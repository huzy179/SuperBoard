import { motion } from 'framer-motion';

type SectionSkeletonProps = {
  rows?: number;
};

type SectionErrorProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionSkeleton({ rows = 3 }: SectionSkeletonProps) {
  return (
    <div
      className="grid gap-var(--space-6) sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="relative overflow-hidden rounded-md border border-white/5 bg-white/[0.01] p-var(--space-6) shadow-inner"
        >
          <div className="h-3 w-2/3 animate-pulse rounded-xs bg-white/10" />
          <div className="mt-4 h-2 w-full animate-pulse rounded-xs bg-white/5" />
          <div className="mt-2 h-2 w-5/6 animate-pulse rounded-xs bg-white/5" />
          <div className="mt-6 h-2 w-1/4 animate-pulse rounded-xs bg-brand-500/20" />

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function SectionError({ title, message, actionLabel, onAction }: SectionErrorProps) {
  return (
    <div className="rounded-md border border-rose-500/10 bg-rose-500/[0.02] p-var(--space-5) backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">{title}</p>
          <p className="text-sm text-white/60 font-bold tracking-tight">{message}</p>
        </div>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-sm bg-rose-500 px-var(--space-4) py-var(--space-2) text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-rose-600 active:scale-95 shadow-glow-rose/20"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
