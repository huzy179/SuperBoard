'use client';

import { useState } from 'react';
import type { ProjectItemDTO } from '@superboard/shared';
import { formatDate } from '@/lib/format-date';
import { percentOf } from '@/lib/utils';
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
      className="group relative flex flex-col h-full rounded-card bg-surface-card border border-surface-border overflow-hidden shadow-luxe transition-shadow hover:shadow-glass"
    >
      <div className="flex items-start justify-between gap-4 p-5 border-b border-surface-border">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-black/[0.02]"
            style={{ backgroundColor: project.color ? `${project.color}12` : undefined }}
            aria-hidden
          >
            <span className="text-xl">{project.icon || '🚀'}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-lg font-semibold text-[color:var(--color-ink)]">
                {project.name}
              </h3>
              <ArrowUpRight size={18} className="text-[color:var(--color-faint)] shrink-0" />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-2 py-0.5 text-xs font-semibold tracking-[0.125px] text-[color:var(--color-focus)]">
                {project.key || 'NODE'}
              </span>
              <span className="text-xs text-[color:var(--color-muted)]">Active</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(project.id);
          }}
          className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            isPriority
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-black/[0.02] border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)]'
          }`}
          aria-label={isPriority ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={16} fill={isPriority ? 'currentColor' : 'transparent'} />
        </button>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {project.description && (
          <p className="line-clamp-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
            {project.description}
          </p>
        )}

        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[color:var(--color-muted)] flex items-center gap-2">
              <Database size={12} /> Progress
            </span>
            <span className="text-[color:var(--color-ink)] font-medium">{completionPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[color:var(--color-faint)]">
            <span>{project.doneTaskCount} done</span>
            <span>{project.taskCount} total</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between">
        <div className="text-xs text-[color:var(--color-faint)]">
          Updated {formatDate(project.updatedAt)}
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`p-2 rounded-lg border transition-colors ${
              isMenuOpen
                ? 'bg-black/[0.04] border-surface-border text-[color:var(--color-ink)]'
                : 'bg-black/[0.02] border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)]'
            }`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
          >
            <MoreHorizontal size={14} />
          </button>

          {isMenuOpen && (
            <div className="absolute bottom-12 right-0 w-56 rounded-xl border border-surface-border bg-surface-card p-2 shadow-glass z-50">
              <div className="px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] border-b border-surface-border mb-1">
                Actions
              </div>
              <button
                onClick={() => onOpen(`${openHref}?view=board`)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
              >
                <LayoutGrid size={16} className="text-brand-500" /> Board
              </button>
              <button
                onClick={() => onOpen(`${openHref}?view=list`)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
              >
                <List size={16} className="text-sky-600" /> List
              </button>
              <button
                onClick={() => onOpen(`${openHref}?view=calendar`)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
              >
                <Calendar size={16} className="text-indigo-600" /> Calendar
              </button>

              <div className="my-1 h-px bg-surface-border" />

              <button
                onClick={() => onOpenEdit(project)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
              >
                <Settings size={16} /> Edit
              </button>
              <button
                onClick={() => onClearRememberedContext(project.id)}
                disabled={!hasRememberedContext(project.id)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors disabled:opacity-40"
              >
                <History size={16} /> Clear context
              </button>
              <button
                onClick={() => onArchive(project.id)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <Archive size={16} /> Archive
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
