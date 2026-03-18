'use client';

import { EmptyStateCard, SectionError, SectionSkeleton } from '@/components/ui/page-states';
import { useProjectList } from '@/hooks/use-project-list';

export default function JiraHomePage() {
  const { projectsLoading, projects, projectsError, reloadProjects } = useProjectList(true);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <section>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Các dự án của bạn</h2>
        <p className="mt-2 text-slate-600">Quản lý và theo dõi tiến độ các dự án đang triển khai</p>
      </div>

      <div>
        {projectsLoading ? (
          <SectionSkeleton rows={6} />
        ) : projectsError ? (
          <SectionError
            title="Không thể tải danh sách dự án"
            message={projectsError}
            actionLabel="Thử lại"
            onAction={reloadProjects}
          />
        ) : projects.length === 0 ? (
          <EmptyStateCard
            title="Chưa có dự án nào"
            description="Hãy tạo dự án mới để bắt đầu"
            actionLabel="Tạo dự án"
            onAction={() => {}}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative overflow-hidden rounded-xl border border-surface-border bg-surface-card transition-all hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100"
              >
                <div
                  className="absolute left-0 top-0 h-1 w-full transition-colors group-hover:bg-brand-500"
                  style={{ backgroundColor: project.color || '#10b981' }}
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

                      {project.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {project.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <span>📅</span>
                        <time>{formatDate(project.createdAt)}</time>
                      </div>
                    </div>

                    {project.color && (
                      <div className="shrink-0">
                        <div
                          className="h-8 w-8 rounded-lg border border-surface-border shadow-sm"
                          style={{ backgroundColor: project.color }}
                          title={project.color}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-surface-border pt-4">
                    <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                      Hoạt động
                    </span>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-500/0 to-brand-500/0 transition-colors group-hover:from-brand-500/5 group-hover:to-brand-500/10" />
              </div>
            ))}

            <button
              type="button"
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
        )}
      </div>
    </section>
  );
}
