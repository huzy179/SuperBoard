import { useQuery } from '@tanstack/react-query';
import { reportService } from '../api/report-service';

export function useProjectReport(projectId: string) {
  return useQuery({
    queryKey: ['project-report', projectId],
    queryFn: () => reportService.getProjectReport(projectId),
    enabled: !!projectId,
  });
}
