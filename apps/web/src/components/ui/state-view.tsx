'use client';

import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';

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
    <div className={`flex flex-col items-center justify-center p-10 text-center ${className}`}>
      {state === 'loading' && (
        <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-card p-8 shadow-sm">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-surface-bg">
            <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[color:var(--color-ink)]">
            Đang tải dữ liệu…
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Vui lòng chờ trong giây lát.
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="w-full max-w-md rounded-lg border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[color:var(--color-ink)]">
            {title || 'Có lỗi xảy ra'}
          </h3>
          <p className="mt-1 text-sm text-rose-700/90 leading-relaxed">
            {error || message || 'Không thể tải dữ liệu. Vui lòng thử lại.'}
          </p>
          {onAction ? (
            <div className="mt-5 flex justify-center">
              <AppButton
                onClick={onAction}
                variant="primary"
                size="md"
                leftIcon={<RefreshCw size={14} />}
              >
                {actionLabel || 'Thử lại'}
              </AppButton>
            </div>
          ) : null}
        </div>
      )}

      {state === 'empty' && (
        <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-card p-8 shadow-sm">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-surface-border bg-surface-bg">
            <Inbox className="h-6 w-6 text-[color:var(--color-muted)]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[color:var(--color-ink)]">
            {title || 'Chưa có dữ liệu'}
          </h3>
          <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
            {message || 'Chưa có nội dung để hiển thị.'}
          </p>
          {onAction ? (
            <div className="mt-5 flex justify-center">
              <AppButton onClick={onAction} variant="secondary" size="md">
                {actionLabel || 'Tạo mới'}
              </AppButton>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
