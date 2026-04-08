'use client';

import { useRouter } from 'next/navigation';
import type { ProjectItemDTO } from '@superboard/shared';
import { ProjectCard } from '@/features/jira/components/project-card';

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

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          onOpen={(href) => router.push(href)}
          onOpenEdit={onOpenEdit}
          onArchive={onArchive}
          isArchivingProject={isArchivingProject}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
          getProjectOpenHref={getProjectOpenHref}
          onClearRememberedContext={onClearRememberedContext}
          hasRememberedContext={hasRememberedContext}
        />
      ))}

      {showCreateCard ? (
        <button
          type="button"
          onClick={onOpenCreate}
          className="group relative rounded-xl border-2 border-dashed border-surface-border bg-surface-bg p-6 text-center transition-all hover:border-brand-300 hover:bg-brand-50/50"
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
