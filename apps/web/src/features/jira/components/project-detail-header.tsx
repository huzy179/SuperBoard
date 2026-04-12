'use client';

import Link from 'next/link';
import type { ProjectDetailDTO } from '@superboard/shared';
import { formatDate } from '@/lib/format-date';
import { getInitials } from '@/lib/helpers';

interface ProjectDetailHeaderProps {
  project: ProjectDetailDTO;
  projectKey: string | null;
  currentViewLabel: string;
  viewMode: 'board' | 'list' | 'calendar';
  setViewMode: (mode: 'board' | 'list' | 'calendar') => void;
  viewerCount: number;
  setShowCreateTaskPanel: (show: boolean | ((val: boolean) => boolean)) => void;
  isCopyLinkSuccess: boolean;
  onCopyFilterLink: () => void;
  onOpenFilterInNewTab: () => void;
}

export function ProjectDetailHeader({
  project,
  projectKey,
  currentViewLabel,
  viewMode,
  setViewMode,
  viewerCount,
  setShowCreateTaskPanel,
  isCopyLinkSuccess,
  onCopyFilterLink,
  onOpenFilterInNewTab,
}: ProjectDetailHeaderProps) {
  const visibleMemberAvatars = project.members.slice(0, 5);

  return (
    <header className="space-y-4 pb-4">
      <div className="mb-3">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link
            href="/jira"
            className="rounded-md px-2 py-1 font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            Dự án
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-500">{project.name}</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">{currentViewLabel}</span>
        </nav>
      </div>

      <div className="mb-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{project.icon || '📊'}</span>
              <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
              {projectKey ? (
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500">
                  {projectKey}
                </span>
              ) : null}
              <Link
                href={`/jira/projects/${project.id}/settings/workflow`}
                className="ml-1 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="Cấu hình quy trình (Workflow)"
              >
                ⚙️
              </Link>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-500">{currentViewLabel}</p>
            <p className="mt-2 text-sm text-slate-600">{project.description || 'Không có mô tả'}</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                {visibleMemberAvatars.map((member) => (
                  <div
                    key={member.id}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[11px] font-semibold text-slate-700"
                    title={member.fullName}
                  >
                    {getInitials(member.fullName)}
                  </div>
                ))}
              </div>
              <span className="text-slate-300">|</span>
              <span className="text-sm font-medium text-slate-500">Bộ lọc</span>
              <span className="text-xs text-slate-400">
                Cập nhật: {formatDate(project.updatedAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() => setShowCreateTaskPanel((value) => !value)}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              + Tạo task
            </button>
            <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
              👀 {viewerCount} đang xem
            </span>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Lịch
            </button>
            <Link
              href={`/jira/projects/${project.id}/reports`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Báo cáo
            </Link>
            <Link
              href={`/jira/projects/${project.id}/automation`}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
              title="Tự động hóa dự án"
            >
              ⚡ Tự động hóa
            </Link>
            <button
              type="button"
              onClick={onCopyFilterLink}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isCopyLinkSuccess
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {isCopyLinkSuccess ? 'Đã sao chép' : 'Sao chép link'}
            </button>
            <button
              type="button"
              onClick={onOpenFilterInNewTab}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Mở tab mới
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
