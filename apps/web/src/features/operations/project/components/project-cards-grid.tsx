'use client';

import { useRouter } from 'next/navigation';
import type { ProjectItemDTO } from '@superboard/shared';
import { ProjectCard } from '@/features/operations/project/components/project-card';
import { Plus } from 'lucide-react';

type ProjectCardsGridProps = {
  projects: ProjectItemDTO[];
  onOpenCreate: () => void;
  onOpenEdit: (project: ProjectItemDTO) => void;
  onArchive: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
  getProjectOpenHref: (projectId: string) => string;
  onClearRememberedContext: (projectId: string) => void;
  hasRememberedContext: (projectId: string) => boolean;
  isArchivingProject: (projectId: string) => boolean;
  showCreateCard?: boolean;
};

export function ProjectCardsGrid({
  projects,
  onOpenCreate,
  onOpenEdit,
  onArchive,
  onToggleFavorite,
  isFavorite,
  getProjectOpenHref,
  onClearRememberedContext,
  hasRememberedContext,
  isArchivingProject,
  showCreateCard = true,
}: ProjectCardsGridProps) {
  const router = useRouter();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onOpen={(href) => router.push(href)}
          onOpenEdit={onOpenEdit}
          onArchive={onArchive}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
          isArchiving={isArchivingProject(project.id)}
          getProjectOpenHref={getProjectOpenHref}
          onClearRememberedContext={onClearRememberedContext}
          hasRememberedContext={hasRememberedContext}
        />
      ))}

      {showCreateCard && (
        <button
          type="button"
          onClick={onOpenCreate}
          className="group relative flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed border-surface-border bg-surface-card p-10 transition-colors hover:bg-[color:var(--color-surface-alt)]/55"
        >
          <div className="relative p-4 bg-brand-50 rounded-xl border border-brand-500/15 transition-colors group-hover:bg-brand-100">
            <Plus size={24} className="text-brand-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-base font-semibold text-[color:var(--color-ink)]">New project</p>
            <p className="text-sm text-[color:var(--color-muted)] leading-relaxed px-6">
              Tạo project mới để bắt đầu quản lý công việc.
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
