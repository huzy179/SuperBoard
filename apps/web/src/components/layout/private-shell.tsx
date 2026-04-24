'use client';

import { useState, type ReactNode, useEffect } from 'react';
import Link from 'next/link';
import type { AuthUserDTO } from '@superboard/shared';
import type { NavItem } from '@/lib/navigation';
import { isNavItemActive } from '@/lib/navigation';
import { AppBrand } from './app-brand';
import { NotificationBell } from '@/features/system/notifications/components/notification-bell';
import { CommandPalette } from '@/features/system/search/components/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
import { WorkspaceSwitcher } from '@/features/system/workspace/components/WorkspaceSwitcher';
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

import { motion, AnimatePresence } from 'framer-motion';

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

      <div className="flex h-16 shrink-0 items-center justify-between px-var(--space-6) border-b border-white/5 bg-white/[0.01]">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-var(--space-3)">
            <AppBrand subtitle="Workspace" variant="dark" />
            <SingularityPulse />
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-full flex justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse shadow-[0_0_8px_rgba(var(--color-brand-500),0.5)]" />
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-sm text-white/20 hover:text-white hover:bg-white/5 transition-all hidden lg:flex border border-transparent hover:border-white/5"
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
        className={`px-var(--space-4) pt-var(--space-6) pb-var(--space-2) ${sidebarCollapsed ? 'flex justify-center' : ''}`}
      >
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={`group flex items-center gap-3 rounded-md bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] hover:border-brand-500/30 ${
            sidebarCollapsed ? 'p-2.5' : 'w-full px-var(--space-4) py-var(--space-3)'
          }`}
        >
          <Search size={14} className="text-white/30 group-hover:text-brand-400" />
          {!sidebarCollapsed && (
            <>
              <span className="font-bold text-[9px] uppercase tracking-widest text-white/20 group-hover:text-white/60">
                Search Command
              </span>
              <div className="ml-auto flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <kbd className="rounded-xs bg-slate-950 px-1.5 py-0.5 text-[8px] font-black text-white/40 border border-white/10 group-hover:text-brand-400">
                  ⌘
                </kbd>
                <kbd className="rounded-xs bg-slate-950 px-1.5 py-0.5 text-[8px] font-black text-white/40 border border-white/10 group-hover:text-brand-400">
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

          const baseClasses = `flex items-center gap-4 rounded-sm px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden`;

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
                  ? 'bg-brand-500/5 text-brand-400 border border-brand-500/20'
                  : isHighlighted
                    ? 'bg-indigo-500/5 text-white/60 border border-indigo-500/10'
                    : 'text-white/20 hover:bg-white/[0.03] hover:text-white/80 border border-transparent'
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
                <div className="ml-auto w-1 h-3 rounded-xs bg-brand-500 shadow-glow-brand relative z-10" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer User Profile */}
      <div className="shrink-0 p-var(--space-4) border-t border-white/5 bg-white/[0.01]">
        <div
          className={`flex items-center gap-3 rounded-md bg-slate-950/50 border border-white/5 p-var(--space-2) hover:bg-slate-950 transition-all group ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <div className="relative shrink-0">
            <AssigneeAvatar
              name={user.fullName}
              color={user.avatarColor}
              src={user.avatarUrl}
              size="sm"
            />
            <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 bg-emerald-500 border border-slate-950 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-black text-white/80 uppercase tracking-widest">
                {user.fullName}
              </p>
              <p className="truncate text-[8px] font-bold text-white/10 uppercase tracking-widest">
                Personal Node
              </p>
            </div>
          )}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
              <NotificationBell />
              <button
                type="button"
                onClick={onLogout}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-white/40 transition-all hover:bg-rose-500/10 hover:text-rose-500 border border-transparent hover:border-rose-500/20"
                title="Terminate Signal"
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
        <header className="flex h-16 shrink-0 items-center gap-6 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl px-var(--space-6) lg:hidden z-[60]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-sm bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all shadow-luxe"
            aria-label="Access Command Menu"
            aria-expanded={sidebarOpen}
            aria-controls="mobile-sidebar"
            aria-haspopup="true"
          >
            <PanelLeft size={18} />
          </button>
          <AppBrand subtitle="Workspace" variant="dark" />
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-sm bg-white/5 border border-white/5 text-white/40 hover:text-white transition-all shadow-luxe"
              aria-label="Global Search"
            >
              <Search size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-var(--space-8) py-var(--space-8) md:px-var(--space-10) lg:px-var(--space-12) relative z-0">
          {/* Internal Grain Texture */}
          <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]" />

          <div className="max-w-[1700px] mx-auto relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
