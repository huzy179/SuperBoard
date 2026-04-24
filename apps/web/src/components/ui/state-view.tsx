'use client';

import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';

interface StateViewProps {
  state: 'loading' | 'error' | 'empty' | 'content';
  error?: string | null;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function StateView({
  state,
  error,
  title,
  message,
  actionLabel,
  onAction,
  children,
  className = '',
}: StateViewProps) {
  if (state === 'content') return <>{children}</>;

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-500 ${className}`}
    >
      {state === 'loading' && (
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full" />
            <Loader2 className="h-12 w-12 text-brand-500 animate-spin relative z-10 mx-auto" />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">
              Synchronizing Nodes...
            </h3>
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
              Accessing neural workspace protocols
            </p>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="space-y-6 max-w-md">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-glow-rose/5">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter text-glow">
              {title || 'Protocol Breach Detected'}
            </h3>
            <p className="text-sm text-white/40 leading-relaxed font-bold">
              {error || message || 'An unexpected error occurred during data synchronization.'}
            </p>
          </div>
          {onAction && (
            <button
              onClick={onAction}
              className="btn-primary px-8 shadow-glow-brand inline-flex items-center gap-3"
            >
              <RefreshCw size={14} />
              {actionLabel || 'Retry Connection'}
            </button>
          )}
        </div>
      )}

      {state === 'empty' && (
        <div className="space-y-6 max-w-md">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Inbox className="h-8 w-8 text-white/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">
              {title || 'Zero Nodes Detected'}
            </h3>
            <p className="text-sm text-white/20 uppercase tracking-widest font-bold">
              {message || 'The current operational vector is empty.'}
            </p>
          </div>
          {onAction && (
            <button onClick={onAction} className="btn-ghost px-8 inline-flex items-center gap-3">
              {actionLabel || 'Initialize First Node'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
