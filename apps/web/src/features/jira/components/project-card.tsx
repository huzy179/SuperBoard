'use client';

import { useState } from 'react';
import type { ProjectItemDTO } from '@superboard/shared';
import { formatDate } from '@/lib/format-date';
import { percentOf } from '@/lib/helpers';
import {
  MoreHorizontal,
  LayoutGrid,
  List,
  Calendar,
  Star,
  Settings,
  History,
  Archive,
  ArrowUpRight,
  Database,
} from 'lucide-react';

interface ProjectCardProps {
  project: ProjectItemDTO;
  index: number;
  onOpen: (href: string) => void;
  onOpenEdit: (project: ProjectItemDTO) => void;
  onArchive: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
  isArchiving?: boolean;
  getProjectOpenHref: (projectId: string) => string;
  onClearRememberedContext: (projectId: string) => void;
  hasRememberedContext: (projectId: string) => boolean;
}

export function ProjectCard({
  project,
  index,
  onOpen,
  onOpenEdit,
  onArchive,
  onToggleFavorite,
  isFavorite,
  getProjectOpenHref,
  onClearRememberedContext,
  hasRememberedContext,
}: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const completionPercent =
    project.taskCount > 0 ? percentOf(project.doneTaskCount, project.taskCount) : 0;
  const openHref = getProjectOpenHref(project.id);
  const isPriority = isFavorite(project.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(openHref)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(openHref);
        }
      }}
      className="group relative flex flex-col h-full rounded-[2.5rem] bg-slate-900 border border-white/5 overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-glass"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Rim Lighting */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent transition-opacity opacity-0 group-hover:opacity-100 duration-700" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Hero Visual */}
      <div className="relative h-24 overflow-hidden bg-slate-950/50">
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 blur-2xl"
          style={{ backgroundColor: project.color || 'var(--color-brand-500)' }}
        />
        <div className="absolute top-6 left-8">
          <span className="text-4xl drop-shadow-luxe grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110">
            {project.icon || '🚀'}
          </span>
        </div>
        <div className="absolute top-6 right-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(project.id);
            }}
            className={`p-2 rounded-xl border transition-all ${
              isPriority
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-glow-amber'
                : 'bg-white/5 border-white/5 text-white/20 hover:text-white hover:bg-white/10'
            }`}
          >
            <Star size={14} fill={isPriority ? 'currentColor' : 'transparent'} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 space-y-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none group-hover:text-brand-400 transition-colors">
              {project.name}
            </h3>
            <ArrowUpRight
              size={18}
              className="text-white/10 group-hover:text-brand-400 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 font-mono text-[9px] font-black text-white/30 tracking-widest uppercase italic">
              {project.key || 'NODE_UNNAMED'}
            </span>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
              • ACTIVE PROTOCOL
            </span>
          </div>
        </div>

        {project.description && (
          <p className="line-clamp-2 text-xs font-medium text-white/40 leading-relaxed italic">
            "{project.description}"
          </p>
        )}

        {/* Completion Vector */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-white/30 flex items-center gap-2">
              <Database size={10} /> Sync Status
            </span>
            <span className="text-brand-400 shadow-glow-brand">{completionPercent}%</span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 shadow-glow-brand transition-all duration-1000"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold text-white/20 tracking-widest">
            <span>{project.doneTaskCount} RESOLVED</span>
            <span>{project.taskCount} TOTAL</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-8 pb-8 pt-2 flex items-center justify-between relative z-10">
        <div className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
          SYN_LATENCY: {formatDate(project.updatedAt)}
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all ${
              isMenuOpen
                ? 'bg-white text-slate-950 shadow-luxe'
                : 'bg-white/5 border-white/5 text-white/20 hover:text-white hover:bg-white/10'
            }`}
          >
            <MoreHorizontal size={14} />
          </button>

          {isMenuOpen && (
            <div className="absolute bottom-12 right-0 w-56 rounded-3xl border border-white/10 bg-slate-900/90 p-2 shadow-glass backdrop-blur-3xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-3 py-2 text-[8px] font-black text-white/20 uppercase tracking-[0.3em] border-b border-white/5 mb-1">
                Node Configuration
              </div>
              <button
                onClick={() => onOpen(`${openHref}?view=board`)}
                className="flex items-center gap-3 w-full rounded-2xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <LayoutGrid size={14} className="text-brand-400" /> Open Tactical Board
              </button>
              <button
                onClick={() => onOpen(`${openHref}?view=list`)}
                className="flex items-center gap-3 w-full rounded-2xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <List size={14} className="text-cyan-400" /> Open Mission List
              </button>
              <button
                onClick={() => onOpen(`${openHref}?view=calendar`)}
                className="flex items-center gap-3 w-full rounded-2xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Calendar size={14} className="text-indigo-400" /> Neural Chronos
              </button>

              <div className="my-1 h-px bg-white/5" />

              <button
                onClick={() => onOpenEdit(project)}
                className="flex items-center gap-3 w-full rounded-2xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Settings size={14} /> Edit Mission Spec
              </button>
              <button
                onClick={() => onClearRememberedContext(project.id)}
                disabled={!hasRememberedContext(project.id)}
                className="flex items-center gap-3 w-full rounded-2xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20"
              >
                <History size={14} /> Deconstruct Context
              </button>
              <button
                onClick={() => onArchive(project.id)}
                className="flex items-center gap-3 w-full rounded-2xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <Archive size={14} /> Terminate Node
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
