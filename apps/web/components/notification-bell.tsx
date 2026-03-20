'use client';

import { useState, type ReactNode } from 'react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/use-notifications';
import { formatRelativeTime } from '@/lib/format-date';

const BellIcon: ReactNode = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
    />
  </svg>
);

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
      >
        {BellIcon}
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-80 rounded-xl border border-surface-border bg-surface-card shadow-xl animate-slide-up">
          <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
            <span className="text-xs font-semibold text-slate-900">Thông báo</span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-[11px] font-medium text-brand-600 hover:text-brand-700"
              >
                Đánh dấu tất cả đã đọc
              </button>
            ) : null}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">Không có thông báo</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.readAt) markRead.mutate(n.id);
                  }}
                  className={`w-full px-3 py-2 text-left transition-colors hover:bg-slate-50 ${!n.readAt ? 'bg-brand-50/40' : ''}`}
                >
                  <p className="text-xs text-slate-700">
                    {(n.payload as Record<string, string>).message ?? n.type}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
