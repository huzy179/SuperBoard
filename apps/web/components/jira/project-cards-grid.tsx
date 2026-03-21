import Link from 'next/link';
import type { ProjectItemDTO } from '@superboard/shared';
import { formatDate } from '@/lib/format-date';
import { percentOf } from '@/lib/helpers';

type ProjectCardsGridProps = {
  projects: ProjectItemDTO[];
  onOpenCreate: () => void;
  onOpenEdit: (project: ProjectItemDTO) => void;
  onArchive: (projectId: string) => void;
  isArchivingProject: (projectId: string) => boolean;
};

export function ProjectCardsGrid({
  projects,
  onOpenCreate,
  onOpenEdit,
  onArchive,
  isArchivingProject,
}: ProjectCardsGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <div
          key={project.id}
          className="animate-slide-up group relative overflow-hidden rounded-xl border border-surface-border bg-surface-card transition-all hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        >
          <div
            className="absolute left-0 top-0 h-1 w-full transition-colors group-hover:bg-brand-500"
            style={{ backgroundColor: project.color || 'var(--color-brand-500)' }}
          />

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{project.icon || '📊'}</span>
                  <h3 className="truncate font-semibold text-slate-900 transition-colors group-hover:text-brand-600">
                    {project.name}
                  </h3>
                </div>

                {project.key ? (
                  <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-500">
                    {project.key}
                  </span>
                ) : null}

                {project.description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{project.description}</p>
                ) : null}

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <span>📅</span>
                  <time>{formatDate(project.createdAt)}</time>
                </div>

                {project.taskCount > 0 ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {project.doneTaskCount}/{project.taskCount} hoàn thành
                      </span>
                      <span>{percentOf(project.doneTaskCount, project.taskCount)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-brand-500 transition-all"
                        style={{ width: `${percentOf(project.doneTaskCount, project.taskCount)}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {project.color ? (
                <div className="shrink-0">
                  <div
                    className="h-8 w-8 rounded-lg border border-surface-border shadow-sm"
                    style={{ backgroundColor: project.color }}
                    title={project.color}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4 border-t border-surface-border pt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  Hoạt động
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(project)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                      />
                    </svg>
                    Sửa
                  </button>
                  <button
                    type="button"
                    disabled={isArchivingProject(project.id)}
                    onClick={() => onArchive(project.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                      />
                    </svg>
                    {isArchivingProject(project.id) ? 'Đang lưu trữ...' : 'Lưu trữ'}
                  </button>
                  <Link
                    href={`/jira/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Mở project
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-500/0 to-brand-500/0 transition-colors group-hover:from-brand-500/5 group-hover:to-brand-500/10" />
        </div>
      ))}

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
    </div>
  );
}
