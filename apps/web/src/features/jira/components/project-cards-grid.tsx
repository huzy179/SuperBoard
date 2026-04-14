'use client';

import { useRouter } from 'next/navigation';
import type { ProjectItemDTO } from '@superboard/shared';
import { ProjectCard } from '@/features/jira/components/project-card';
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
    <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
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
          className="group relative flex flex-col items-center justify-center gap-6 rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.02] p-10 transition-all duration-500 hover:border-brand-500/50 hover:bg-white/[0.05] hover:scale-[1.02] active:scale-[0.98] min-h-[380px]"
        >
          <div className="relative p-6 bg-slate-900 rounded-3xl border border-white/5 group-hover:bg-brand-500/10 group-hover:border-brand-500/20 transition-all duration-500 group-hover:shadow-glow-brand">
            <Plus
              size={32}
              className="text-white/20 group-hover:text-brand-400 group-hover:scale-110 transition-all duration-500"
            />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-black text-white/40 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
              Initialize New Node
            </p>
            <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest italic leading-relaxed px-6">
              Establish a new operational vector within the workspace.
            </p>
          </div>
          <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] blur-2xl" />
        </button>
      )}
    </div>
  );
}
