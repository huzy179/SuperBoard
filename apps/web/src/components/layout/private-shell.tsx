'use client';

import { useState, type ReactNode, useEffect } from 'react';
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
import { SingularityPulse } from './SingularityPulse';
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
};

const NAV_ICONS: Record<NavItem['icon'], ReactNode> = {
  projects: <LayoutGrid size={18} />,
  dashboard: <PieChart size={18} />,
  settings: <Settings size={18} />,
  notifications: <Bell size={18} />,
  chat: <MessageSquare size={18} />,
  docs: <FileText size={18} />,
};

export function PrivateShell({ children, user, navItems, pathname, onLogout }: PrivateShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navFocus, setNavFocus] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch('/api/v1/executive/navigation-focus')
      .then((res) => res.json())
      .then((body) => setNavFocus(body.data?.highlights ?? []))
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
    <div className="flex h-full flex-col bg-slate-950/40 backdrop-blur-3xl border-r border-white/5 relative z-50">
      {/* Rim Light */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/30 to-transparent" />

      <div className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-white/5 bg-white/5">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-4">
            <AppBrand subtitle="Workspace" variant="dark" />
            <SingularityPulse />
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all hidden lg:flex"
        >
          {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className={sidebarCollapsed ? 'px-2 py-4' : ''}>
        <WorkspaceSwitcher showLabel={!sidebarCollapsed} />
      </div>

      {/* Search Trigger */}
      <div className={`px-4 pt-6 pb-2 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={`group flex items-center gap-3 rounded-2xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.08] hover:border-brand-500/30 hover:shadow-glow-brand ${
            sidebarCollapsed ? 'p-3' : 'w-full px-4 py-3.5'
          }`}
        >
          <Search size={16} className="text-white/30 group-hover:text-brand-400" />
          {!sidebarCollapsed && (
            <>
              <span className="font-black text-[10px] uppercase tracking-widest text-white/20 group-hover:text-white/60">
                Search Command
              </span>
              <div className="ml-auto flex items-center gap-1">
                <kbd className="rounded-[4px] bg-slate-950 px-1.5 py-0.5 text-[8px] font-black text-white/20 border border-white/10 group-hover:text-brand-400">
                  ⌘
                </kbd>
                <kbd className="rounded-[4px] bg-slate-950 px-1.5 py-0.5 text-[8px] font-black text-white/20 border border-white/10 group-hover:text-brand-400">
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

          const baseClasses = `flex items-center gap-4 rounded-2xl px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden`;

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className={`${baseClasses} cursor-not-allowed text-white/10 opacity-40 justify-center lg:justify-start`}
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
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-glow-brand'
                  : isHighlighted
                    ? 'bg-indigo-500/5 text-white/60 border border-indigo-500/20'
                    : 'text-white/20 hover:bg-white/[0.04] hover:text-white/80 border border-transparent'
              } ${sidebarCollapsed ? 'px-0 justify-center' : ''}`}
            >
              {isHighlighted && (
                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
              )}
              <div
                className={`${isActive ? 'text-brand-400 animate-pulse' : isHighlighted ? 'text-indigo-400' : 'text-white/20 group-hover:text-brand-400'} transition-all duration-500 shrink-0 relative z-10`}
              >
                {NAV_ICONS[item.icon]}
              </div>
              {!sidebarCollapsed && (
                <span className="relative z-10 flex items-center gap-2">
                  {item.label}
                  {isHighlighted && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-glow-indigo animate-ping" />
                  )}
                </span>
              )}
              {!sidebarCollapsed && isActive && (
                <div className="ml-auto w-1 h-3 rounded-full bg-brand-500 shadow-glow-brand relative z-10" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Profile */}
      <div className="shrink-0 p-4 border-t border-white/5 bg-white/2">
        <div
          className={`flex items-center gap-4 rounded-3xl bg-slate-950/50 border border-white/5 p-3 hover:bg-slate-950 transition-all group ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <div className="relative shrink-0">
            <AssigneeAvatar
              name={user.fullName}
              color={user.avatarColor}
              src={user.avatarUrl}
              size="md"
            />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-glow-brand" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-black text-white uppercase tracking-wider">
                {user.fullName}
              </p>
              <p className="truncate text-[9px] font-bold text-white/20 uppercase tracking-widest italic">
                Personal Node
              </p>
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
              <NotificationBell />
              <button
                type="button"
                onClick={onLogout}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 transition-all hover:bg-rose-500/10 hover:text-rose-500"
                title="Terminate Signal"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Global Glows */}
      <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-500/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="fixed -bottom-[20%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col z-50 transition-all duration-700 ease-in-out ${sidebarCollapsed ? 'w-24' : 'w-80'}`}
      >
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <aside
            id="mobile-sidebar"
            className="relative z-[120] h-full w-80 shadow-glass animate-in slide-in-from-left duration-700"
          >
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile top bar */}
        <header className="flex h-20 shrink-0 items-center gap-6 border-b border-white/5 bg-slate-950/40 backdrop-blur-3xl px-8 lg:hidden z-[60]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all shadow-luxe"
            aria-label="Access Command Menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
          >
            <PanelLeft size={22} />
          </button>
          <AppBrand subtitle="Workspace" variant="dark" />
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all shadow-luxe"
              aria-label="Global Search"
            >
              <Search size={22} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-10 md:px-12 lg:px-16 relative z-0">
          {/* Internal Grain Texture */}
          <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none mix-blend-overlay" />

          <div className="max-w-[1700px] mx-auto relative z-10 animate-in fade-in duration-1000">
            {children}
          </div>
        </main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
