'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ProjectDetailDTO } from '@superboard/shared';
import {
  Activity,
  BarChart3,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Plus,
  Share2,
  Settings2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { formatDate } from '@/lib/format-date';
import { getInitials } from '@/lib/utils';
import { AiPlannerModal } from '@/features/intelligence/ai/components/ai-planner-modal';
import { MissionTimeline } from './MissionTimeline';
import { MissionCommandBriefing } from './MissionCommandBriefing';
import { useProjectDetailContext } from '../context/ProjectDetailContext';

interface ProjectDetailHeaderProps {
  project: ProjectDetailDTO;
  projectKey: string | null;
  viewerCount: number;
  isCopyLinkSuccess: boolean;
  onCopyFilterLink: () => void;
  onPlanExecuted?: () => void;
}

export function ProjectDetailHeader({
  project,
  projectKey,
  viewerCount,
  isCopyLinkSuccess,
  onCopyFilterLink,
  onPlanExecuted,
}: ProjectDetailHeaderProps) {
  const pathname = usePathname();
  const {
    viewMode,
    setViewMode,
    showCreateTaskPanel,
    setShowCreateTaskPanel,
    setShowAutomationPanel,
    setShowKnowledgeMap,
  } = useProjectDetailContext();

  const [showAiPlanner, setShowAiPlanner] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const currentViewLabel = useMemo(() => {
    if (viewMode === 'list') return 'Danh sách';
    if (viewMode === 'calendar') return 'Lịch';
    if (viewMode === 'insights') return 'Phân tích';
    return 'Board';
  }, [viewMode]);

  const visibleMemberAvatars = project.members.slice(0, 5);

  const navItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    mode: 'board' | 'list' | 'calendar' | 'insights';
  }> = [
    { id: 'board', label: 'Bảng công việc', icon: <LayoutGrid size={14} />, mode: 'board' },
    { id: 'list', label: 'Danh sách', icon: <List size={14} />, mode: 'list' },
    { id: 'calendar', label: 'Lịch', icon: <CalendarIcon size={14} />, mode: 'calendar' },
    { id: 'insights', label: 'Phân tích', icon: <Sparkles size={14} />, mode: 'insights' },
  ];

  return (
    <header className="space-y-4 pb-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]"
      >
        <a href="/jira" className="hover:text-[color:var(--color-ink)] transition-colors">
          Workspace
        </a>
        <span className="text-[color:var(--color-faint)]">/</span>
        <span className="truncate text-[color:var(--color-ink)] font-medium">{project.name}</span>
        <span className="text-[color:var(--color-faint)]">/</span>
        <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-[0.125px] text-[color:var(--color-focus)]">
          {currentViewLabel}
        </span>
      </nav>

      <section className="rounded-2xl border border-surface-border bg-surface-card shadow-luxe p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4">
              <div
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-black/[0.02]"
                style={{ backgroundColor: project.color ? `${project.color}12` : undefined }}
                aria-hidden
              >
                <span className="text-2xl">{project.icon || '🚀'}</span>
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex items-start gap-3">
                  <h1 className="truncate text-2xl md:text-3xl font-semibold tracking-tight text-[color:var(--color-ink)]">
                    {project.name}
                  </h1>
                  <Link
                    href={`/jira/projects/${project.id}/settings/workflow`}
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-border bg-black/[0.02] text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
                    title="Workflow settings"
                  >
                    <Settings2 size={16} />
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {projectKey ? (
                    <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-xs font-semibold tracking-[0.125px] text-[color:var(--color-focus)]">
                      {projectKey}
                    </span>
                  ) : null}
                  <span className="text-sm text-[color:var(--color-muted)]">
                    Updated {formatDate(project.updatedAt)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-black/[0.02] px-3 py-1 text-xs text-[color:var(--color-muted)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    {viewerCount} viewing
                  </span>
                </div>

                <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                  {project.description || 'No description yet.'}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <div className="flex -space-x-2">
                    {visibleMemberAvatars.map((member) => (
                      <div
                        key={member.id}
                        title={member.fullName}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-surface-border bg-surface-card text-[11px] font-semibold text-[color:var(--color-ink)]"
                      >
                        {getInitials(member.fullName)}
                      </div>
                    ))}
                    {project.members.length > 5 ? (
                      <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-surface-border bg-black/[0.02] text-[11px] font-semibold text-[color:var(--color-muted)]">
                        +{project.members.length - 5}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <AppButton
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => setShowCreateTaskPanel(!showCreateTaskPanel)}
            >
              {showCreateTaskPanel ? 'Close' : 'New task'}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={16} />}
              onClick={() => setShowAiPlanner(true)}
            >
              AI planner
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Activity size={16} />}
              onClick={() => setShowBriefing(true)}
            >
              Sitrep
            </AppButton>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-1 overflow-x-auto elite-scrollbar scrollbar-hide rounded-lg border border-surface-border bg-black/[0.02] p-1">
            {navItems.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewMode(v.mode)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === v.mode
                    ? 'bg-surface-card border border-surface-border text-[color:var(--color-ink)] shadow-sm'
                    : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03]'
                }`}
              >
                {v.icon}
                <span className="hidden sm:inline whitespace-nowrap">{v.label}</span>
              </button>
            ))}
            <Link
              href={`/jira/projects/${project.id}/reports`}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname?.endsWith('/reports')
                  ? 'bg-surface-card border border-surface-border text-[color:var(--color-ink)] shadow-sm'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.03]'
              }`}
            >
              <BarChart3 size={14} />
              <span className="hidden sm:inline whitespace-nowrap">Reports</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAutomationPanel(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-surface-border bg-black/[0.02] text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)] transition-colors"
              title="Automation"
            >
              <Zap size={18} />
            </button>
            <button
              type="button"
              onClick={() => setShowKnowledgeMap(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-surface-border bg-brand-50 text-brand-500 hover:bg-brand-100 transition-colors"
              title="Knowledge map"
            >
              <Activity size={18} />
            </button>
            <button
              type="button"
              onClick={onCopyFilterLink}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                isCopyLinkSuccess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-black/[0.02] border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)]'
              }`}
              title="Share"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </section>

      <MissionTimeline projectId={project.id} />

      <MissionCommandBriefing
        projectId={project.id}
        workspaceId={project.workspaceId}
        isOpen={showBriefing}
        onClose={() => setShowBriefing(false)}
      />

      <AiPlannerModal
        projectId={project.id}
        isOpen={showAiPlanner}
        onClose={() => setShowAiPlanner(false)}
        onPlanExecuted={() => onPlanExecuted?.()}
      />
    </header>
  );
}
