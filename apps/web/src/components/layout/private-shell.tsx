'use client';

import { useState, type ReactNode, useEffect } from 'react';
import Link from 'next/link';
import type { AuthUserDTO } from '@superboard/shared';
import type { NavItem } from '@/lib/navigation';
import { isNavItemActive } from '@/lib/navigation';
import { AppBrand } from './app-brand';
import { NotificationBell } from '@/features/system/notifications/components/notification-bell';
import { CommandPalette } from '@/features/system/search/components/CommandPalette';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
import { WorkspaceSwitcher } from '@/features/system/workspace/components/WorkspaceSwitcher';
import { getNavigationFocus } from '@/features/intelligence/executive/api/executive-service';
import {
  MessageSquare,
  FileText,
  Settings,
  PieChart,
  Bell,
  LogOut,
  Search,
  LayoutGrid,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

type PrivateShellProps = {
  children: ReactNode;
  user: AuthUserDTO;
  navItems: NavItem[];
  pathname: string;
  onLogout: () => void;
  noPadding?: boolean;
};

const NAV_ICONS: Record<NavItem['icon'], ReactNode> = {
  projects: <LayoutGrid size={18} />,
  dashboard: <PieChart size={18} />,
  settings: <Settings size={18} />,
  notifications: <Bell size={18} />,
  chat: <MessageSquare size={18} />,
  docs: <FileText size={18} />,
};

export function PrivateShell({
  children,
  user,
  navItems,
  pathname,
  onLogout,
  noPadding,
}: PrivateShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navFocus, setNavFocus] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    getNavigationFocus()
      .then((data) => setNavFocus(data.highlights ?? []))
      .catch(() => {});
  }, []);

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
    <div className="flex h-full flex-col bg-surface-card border-r border-surface-border relative z-50">
      <div className="flex h-16 shrink-0 items-center justify-between px-[var(--space-6)] border-b border-surface-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-[var(--space-3)]">
            <AppBrand subtitle="Workspace" variant="light" />
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-black/[0.04] transition-colors hidden lg:flex"
        >
          {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className={sidebarCollapsed ? 'px-2 py-4' : ''}>
        <WorkspaceSwitcher showLabel={!sidebarCollapsed} />
      </div>

      {/* Search Trigger */}
      <div
        className={`px-[var(--space-4)] pt-[var(--space-6)] pb-[var(--space-2)] ${sidebarCollapsed ? 'flex justify-center' : ''}`}
      >
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={`group flex items-center gap-3 rounded-md bg-black/[0.02] border border-surface-border transition-colors hover:bg-black/[0.04] ${
            sidebarCollapsed ? 'p-2.5' : 'w-full px-[var(--space-4)] py-[var(--space-3)]'
          }`}
        >
          <Search size={14} className="text-slate-500" />
          {!sidebarCollapsed && (
            <>
              <span className="text-sm font-medium text-slate-600">Search</span>
              <div className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                <kbd className="rounded-sm bg-black/[0.03] px-1.5 py-0.5 font-semibold text-slate-600 border border-surface-border">
                  ⌘
                </kbd>
                <kbd className="rounded-sm bg-black/[0.03] px-1.5 py-0.5 font-semibold text-slate-600 border border-surface-border">
                  K
                </kbd>
              </div>
            </>
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const isActive = !item.disabled && isNavItemActive(pathname, item.href);
          const focusData = navFocus.find(
            (f) =>
              typeof f.sector === 'string' && f.sector.toLowerCase() === item.label.toLowerCase(),
          );
          const isHighlighted = !!focusData && !isActive;

          const baseClasses =
            'flex items-center gap-3 rounded-sm px-4 py-2.5 text-sm font-medium transition-colors duration-150 relative';

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className={`${baseClasses} cursor-not-allowed text-[color:var(--color-faint)] opacity-60 justify-center lg:justify-start`}
                title="Protocol Pending"
              >
                <div className="shrink-0">{NAV_ICONS[item.icon]}</div>
                {!sidebarCollapsed && <span>{item.label}</span>}
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
                  ? 'bg-brand-500/[0.06] text-brand-600 border border-brand-500/10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  : isHighlighted
                    ? 'bg-black/[0.03] text-[color:var(--color-ink)] border border-surface-border'
                    : 'text-[color:var(--color-muted)] hover:bg-black/[0.02] hover:text-[color:var(--color-ink)] border border-transparent'
              } ${sidebarCollapsed ? 'px-0 justify-center' : ''}`}
            >
              <div
                className={`${isActive ? 'text-brand-500' : isHighlighted ? 'text-[color:var(--color-ink)]' : 'text-[color:var(--color-muted)] group-hover:text-brand-500'} transition-colors duration-150 shrink-0`}
              >
                {NAV_ICONS[item.icon]}
              </div>
              {!sidebarCollapsed && (
                <span className="flex items-center gap-2 font-semibold tracking-tight">
                  {item.label}
                </span>
              )}
              {!sidebarCollapsed && isActive && (
                <div className="ml-auto w-1 h-3 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Profile */}
      <div className="shrink-0 p-[var(--space-4)] border-t border-surface-border bg-surface-card">
        <div
          className={`flex items-center gap-3 rounded-md bg-black/[0.02] border border-surface-border p-[var(--space-2)] hover:bg-black/[0.03] transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <div className="relative shrink-0">
            <AssigneeAvatar
              name={user.fullName}
              color={user.avatarColor}
              src={user.avatarUrl}
              size="sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-emerald-500 border border-surface-card rounded-full" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[color:var(--color-ink)]">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-[color:var(--color-muted)]">Personal</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                type="button"
                onClick={onLogout}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-[color:var(--color-muted)] transition-colors hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-200"
                title="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-bg font-sans text-[color:var(--color-ink)]">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col z-50 transition-all duration-200 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-72'}`}
      >
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <aside id="mobile-sidebar" className="relative z-[120] h-full w-80 shadow-luxe">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile top bar */}
        <header className="flex h-16 shrink-0 items-center gap-6 border-b border-surface-border bg-surface-bg px-[var(--space-6)] lg:hidden z-[60]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-md bg-black/[0.02] border border-surface-border text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Access Command Menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
            aria-haspopup="true"
          >
            <PanelLeft size={18} />
          </button>
          <AppBrand subtitle="Workspace" variant="light" />
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-black/[0.02] border border-surface-border text-slate-600 hover:text-slate-900 transition-colors"
              aria-label="Global Search"
            >
              <Search size={18} />
            </button>
          </div>
        </header>

        <main
          className={`flex-1 overflow-y-auto relative z-0 ${noPadding ? '' : 'px-[var(--space-8)] py-[var(--space-8)] md:px-[var(--space-10)] lg:px-[var(--space-12)]'}`}
        >
          <div
            className={`mx-auto relative z-10 ${noPadding ? 'h-full w-full' : 'max-w-[1700px]'}`}
          >
            {children}
          </div>
        </main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
