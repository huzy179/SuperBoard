'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ProjectItemDTO } from '@superboard/shared';
import { EmptyStateCard, SectionError, SectionSkeleton } from '@/components/ui/page-states';
import { useProjectList } from '@/hooks/use-project-list';
import { createProject, deleteProject, updateProject } from '@/lib/services/project-service';

export default function JiraHomePage() {
  const { projectsLoading, projects, projectsError, reloadProjects } = useProjectList(true);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectIcon, setProjectIcon] = useState('📌');
  const [projectColor, setProjectColor] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItemDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [archiveLoadingId, setArchiveLoadingId] = useState<string | null>(null);

  const normalizedProjectName = useMemo(() => projectName.trim(), [projectName]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedProjectName) {
      setCreateError('Tên dự án là bắt buộc');
      return;
    }

    setCreateError(null);
    setCreateLoading(true);

    try {
      const description = projectDescription.trim();
      const icon = projectIcon.trim();
      const color = projectColor.trim();

      await createProject({
        name: normalizedProjectName,
        ...(description ? { description } : {}),
        ...(icon ? { icon } : {}),
        ...(color ? { color } : {}),
      });

      setProjectName('');
      setProjectDescription('');
      setProjectIcon('📌');
      setProjectColor('');
      setShowCreatePanel(false);
      reloadProjects();
    } catch (caughtError) {
      setCreateError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo dự án');
    } finally {
      setCreateLoading(false);
    }
  }

  function openEditProject(project: ProjectItemDTO) {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description ?? '');
    setEditIcon(project.icon ?? '📌');
    setEditColor(project.color ?? '');
    setCreateError(null);
  }

  function closeEditProject() {
    setEditingProject(null);
    setEditName('');
    setEditDescription('');
    setEditIcon('');
    setEditColor('');
    setEditLoading(false);
  }

  async function handleUpdateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProject) return;

    const normalizedName = editName.trim();
    if (!normalizedName) {
      setCreateError('Tên dự án là bắt buộc');
      return;
    }

    setEditLoading(true);
    setCreateError(null);

    try {
      await updateProject(editingProject.id, {
        name: normalizedName,
        description: editDescription.trim(),
        icon: editIcon.trim(),
        color: editColor.trim(),
      });
      closeEditProject();
      reloadProjects();
    } catch (caughtError) {
      setCreateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật dự án',
      );
    } finally {
      setEditLoading(false);
    }
  }

  async function handleArchiveProject(projectId: string) {
    if (!confirm('Bạn chắc chắn muốn lưu trữ dự án này?')) return;

    setArchiveLoadingId(projectId);
    setCreateError(null);

    try {
      await deleteProject(projectId);
      reloadProjects();
    } catch (caughtError) {
      setCreateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể lưu trữ dự án',
      );
    } finally {
      setArchiveLoadingId(null);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Các dự án của bạn</h2>
          <p className="mt-2 text-slate-600">
            Quản lý và theo dõi tiến độ các dự án đang triển khai
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreatePanel((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <span>+</span>
          {showCreatePanel ? 'Đóng form' : 'Tạo dự án'}
        </button>
      </div>

      {showCreatePanel ? (
        <form
          onSubmit={handleCreateProject}
          className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Tên dự án
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Ví dụ: Mobile App Revamp"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Icon
              <input
                type="text"
                value={projectIcon}
                onChange={(event) => setProjectIcon(event.target.value)}
                placeholder="📌"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Màu (tuỳ chọn)
              <input
                type="text"
                value={projectColor}
                onChange={(event) => setProjectColor(event.target.value)}
                placeholder="Ví dụ: #2563eb"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Mô tả
              <textarea
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                rows={3}
                placeholder="Mục tiêu hoặc phạm vi chính của dự án"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>

          {createError ? <p className="mt-3 text-sm text-rose-600">{createError}</p> : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreatePanel(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {createLoading ? 'Đang tạo...' : 'Tạo dự án'}
            </button>
          </div>
        </form>
      ) : null}

      {editingProject ? (
        <form
          onSubmit={handleUpdateProject}
          className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm"
        >
          <p className="mb-3 text-sm font-semibold text-slate-800">Chỉnh sửa dự án</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Tên dự án
              <input
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Icon
              <input
                type="text"
                value={editIcon}
                onChange={(event) => setEditIcon(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Màu
              <input
                type="text"
                value={editColor}
                onChange={(event) => setEditColor(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Mô tả
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeEditProject}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      ) : null}

      {createError ? (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {createError}
        </div>
      ) : null}

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
            onAction={() => setShowCreatePanel(true)}
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
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                        Hoạt động
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditProject(project)}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={archiveLoadingId === project.id}
                          onClick={() => {
                            void handleArchiveProject(project.id);
                          }}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                        >
                          {archiveLoadingId === project.id ? 'Đang lưu trữ...' : 'Lưu trữ'}
                        </button>
                        <Link
                          href={`/jira/projects/${project.id}`}
                          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Mở project
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
              onClick={() => setShowCreatePanel(true)}
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
