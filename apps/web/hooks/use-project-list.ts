import { useEffect, useState } from 'react';
import type { ProjectItemDTO } from '@superboard/shared';
import { getProjects } from '@/lib/services/project-service';

type UseProjectListResult = {
  projectsLoading: boolean;
  projects: ProjectItemDTO[];
  projectsError: string | null;
  reloadProjects: () => void;
};

export function useProjectList(enabled: boolean): UseProjectListResult {
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectItemDTO[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  function reloadProjects() {
    setReloadSeed((seed) => seed + 1);
  }

  useEffect(() => {
    if (!enabled) return;

    setProjectsLoading(true);
    setProjectsError(null);
    getProjects()
      .then((items) => {
        setProjects(items);
      })
      .catch((caughtError) => {
        const message = caughtError instanceof Error ? caughtError.message : 'Không tải được dự án';
        setProjectsError(message);
        setProjects([]);
      })
      .finally(() => {
        setProjectsLoading(false);
      });
  }, [enabled, reloadSeed]);

  return { projectsLoading, projects, projectsError, reloadProjects };
}
