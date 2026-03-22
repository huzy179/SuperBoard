'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ProjectItemDTO } from '@superboard/shared';
import { formatDate } from '@/lib/format-date';
import { percentOf } from '@/lib/helpers';

type ProjectCardsGridProps = {
  projects: ProjectItemDTO[];
  onOpenCreate: () => void;
  onOpenEdit: (project: ProjectItemDTO) => void;
  onArchive: (projectId: string) => void;
  isArchivingProject: (projectId: string) => boolean;
  onToggleFavorite: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
  getProjectOpenHref: (projectId: string) => string;
  onClearRememberedContext: (projectId: string) => void;
  hasRememberedContext: (projectId: string) => boolean;
  showCreateCard?: boolean;
};

export function ProjectCardsGrid({
  projects,
  onOpenCreate,
  onOpenEdit,
  onArchive,
  isArchivingProject,
  onToggleFavorite,
  isFavorite,
  getProjectOpenHref,
  onClearRememberedContext,
  hasRememberedContext,
  showCreateCard = true,
}: ProjectCardsGridProps) {
  const router = useRouter();
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => {
        const completionPercent =
          project.taskCount > 0 ? percentOf(project.doneTaskCount, project.taskCount) : 0;

        return (
          <div
            key={project.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              router.push(getProjectOpenHref(project.id));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(getProjectOpenHref(project.id));
              }
            }}
            className="animate-slide-up group relative cursor-pointer overflow-hidden rounded-xl border border-surface-border bg-surface-card text-left transition-all hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
          >
            <div
              className="absolute left-0 top-0 h-1 w-full transition-colors group-hover:bg-brand-500"
              style={{ backgroundColor: project.color || 'var(--color-brand-500)' }}
            />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-base">
                      {project.icon || '📊'}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-brand-600">
                        {project.name}
                      </h3>
                      {project.key ? (
                        <span className="inline-block font-mono text-[11px] font-medium text-slate-500">
                          {project.key}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {project.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {project.description}
                    </p>
                  ) : null}
                </div>

                <div className="relative z-10 flex shrink-0 items-center gap-2">
                  {isFavorite(project.id) ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">
                      ⭐ Ưu tiên
                    </span>
                  ) : null}

                  <div
                    className="relative"
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Mở menu thao tác"
                      aria-expanded={openMenuProjectId === project.id}
                      onClick={() => {
                        setOpenMenuProjectId((previous) =>
                          previous === project.id ? null : project.id,
                        );
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                    >
                      <span className="text-sm">⋯</span>
                    </button>

                    {openMenuProjectId === project.id ? (
                      <div className="absolute right-0 top-10 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/jira/projects/${project.id}?view=board`);
                            setOpenMenuProjectId(null);
                          }}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Mở Board
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/jira/projects/${project.id}?view=list`);
                            setOpenMenuProjectId(null);
                          }}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Mở Danh sách
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            router.push(`/jira/projects/${project.id}?view=calendar`);
                            setOpenMenuProjectId(null);
                          }}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Mở Lịch
                        </button>

                        <div className="my-1 h-px bg-slate-200" />

                        <button
                          type="button"
                          onClick={() => {
                            onToggleFavorite(project.id);
                            setOpenMenuProjectId(null);
                          }}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-amber-700 hover:bg-amber-50"
                        >
                          {isFavorite(project.id) ? 'Bỏ ghim' : 'Ghim dự án'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenEdit(project);
                            setOpenMenuProjectId(null);
                          }}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Sửa dự án
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClearRememberedContext(project.id);
                            setOpenMenuProjectId(null);
                          }}
                          disabled={!hasRememberedContext(project.id)}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Reset ngữ cảnh
                        </button>
                        <button
                          type="button"
                          disabled={isArchivingProject(project.id)}
                          onClick={() => {
                            onArchive(project.id);
                            setOpenMenuProjectId(null);
                          }}
                          className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {isArchivingProject(project.id) ? 'Đang lưu trữ...' : 'Lưu trữ'}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {project.color ? (
                    <div
                      className="h-6 w-6 rounded-md border border-surface-border"
                      style={{ backgroundColor: project.color }}
                      title={project.color}
                    />
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>
                    {project.doneTaskCount}/{project.taskCount} hoàn thành
                  </span>
                  <span className="font-semibold text-slate-700">{completionPercent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-brand-500 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Cập nhật: <time>{formatDate(project.updatedAt)}</time>
                </div>
              </div>

              <div className="mt-3 rounded-md bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                Nhấn vào card để mở project
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-500/0 to-brand-500/0 transition-colors group-hover:from-brand-500/5 group-hover:to-brand-500/10" />
          </div>
        );
      })}

      {showCreateCard ? (
        <button
          type="button"
          onClick={onOpenCreate}
          className="group relative rounded-xl border-2 border-dashed border-surface-border bg-surface-bg p-6 text-center transition-all hover:border-brand-300 hover:bg-brand-50"
        >
          <div className="space-y-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white transition-colors group-hover:bg-brand-100">
              <span className="text-lg text-slate-400 group-hover:text-brand-600">+</span>
            </div>
            <p className="font-semibold text-slate-700 group-hover:text-brand-600">Dự án mới</p>
            <p className="text-xs text-slate-500">Tạo dự án để bắt đầu</p>
          </div>
        </button>
      ) : null}
    </div>
  );
}
