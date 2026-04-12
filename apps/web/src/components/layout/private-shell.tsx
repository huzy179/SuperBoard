'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { AuthUserDTO } from '@superboard/shared';
import type { NavItem } from '@/lib/navigation';
import { isNavItemActive } from '@/lib/navigation';
import { AppBrand } from './app-brand';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { CommandPalette } from '@/components/search/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { AssigneeAvatar } from '@/features/jira/components/task-badges';
import { WorkspaceSwitcher } from '@/features/workspace/components/WorkspaceSwitcher';
import {
  Layout,
  MessageSquare,
  FileText,
  Settings,
  PieChart,
  Bell,
  LogOut,
  Search,
} from 'lucide-react';

type PrivateShellProps = {
  children: ReactNode;
  user: AuthUserDTO;
  navItems: NavItem[];
  pathname: string;
  onLogout: () => void;
};

const NAV_ICONS: Record<NavItem['icon'], ReactNode> = {
  projects: <Layout size={18} />,
  dashboard: <PieChart size={18} />,
  settings: <Settings size={18} />,
  notifications: <Bell size={18} />,
  chat: <MessageSquare size={18} />,
  docs: <FileText size={18} />,
};

export function PrivateShell({ children, user, navItems, pathname, onLogout }: PrivateShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      handler: () => setSearchOpen(true),
    },
    {
      key: 'k',
      ctrlKey: true,
      handler: () => setSearchOpen(true),
    },
  ]);

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/5">
        <AppBrand subtitle="Workspace" variant="dark" />
      </div>

      {/* Workspace Switcher */}
      <WorkspaceSwitcher />

      {/* Search Trigger */}
      <div className="px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group flex w-full items-center gap-3 rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 text-[13px] text-white/40 transition-all hover:bg-white/[0.07] hover:border-white/10 hover:text-white/70"
        >
          <Search size={16} />
          <span className="font-medium text-[12px]">Tìm kiếm lệnh...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-white/20 border border-white/5 group-hover:text-white/40">
              ⌘
            </kbd>
            <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-white/20 border border-white/5 group-hover:text-white/40">
              K
            </kbd>
          </div>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = !item.disabled && isNavItemActive(pathname, item.href);
          const baseClasses =
            'flex items-center gap-3.5 rounded-xl px-4 py-3 text-[13px] font-bold transition-all duration-300';

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className={`${baseClasses} cursor-not-allowed text-white/20 opacity-50`}
                title="Sắp ra mắt"
              >
                {NAV_ICONS[item.icon]}
                <span className="uppercase tracking-widest text-[11px] font-black">
                  {item.label}
                </span>
                <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-black text-white/30 border border-white/5 uppercase">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`${baseClasses} group ${
                isActive
                  ? 'bg-brand-600/10 text-brand-400 shadow-[inset_0_0_12px_rgba(37,99,235,0.05)] border border-brand-500/20'
                  : 'text-white/40 hover:bg-white/[0.03] hover:text-white/70 border border-transparent'
              }`}
            >
              <div
                className={`${isActive ? 'text-brand-500' : 'text-white/20 group-hover:text-white/40'} transition-colors`}
              >
                {NAV_ICONS[item.icon]}
              </div>
              <span className="uppercase tracking-widest text-[11px] font-black">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(37,99,235,0.8)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Profile */}
      <div className="shrink-0 p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3 hover:bg-white/[0.06] transition-all group">
          <AssigneeAvatar
            name={user.fullName}
            color={user.avatarColor}
            src={user.avatarUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-white/90">{user.fullName}</p>
            <p className="truncate text-[10px] font-medium text-white/30 uppercase tracking-tighter italic">
              Personal Space
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
            <NotificationBell />
            <button
              type="button"
              onClick={onLogout}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 transition-all hover:bg-rose-500/10 hover:text-rose-500 active:scale-90"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col shadow-2xl z-50">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <aside
            id="mobile-sidebar"
            className="relative z-[120] h-full w-72 shadow-2xl animate-in slide-in-from-left duration-500"
          >
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-brand-100/20 to-transparent pointer-events-none" />

        {/* Mobile top bar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 lg:hidden z-10">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
            aria-label="Mở menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <Layout size={20} />
          </button>
          <AppBrand subtitle="Workspace" />
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all"
              aria-label="Tìm kiếm"
            >
              <Search size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10 lg:px-12 relative z-0 transition-opacity duration-500">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
