import { useAppQuery } from '@/lib/hooks/use-app-query';
import { queryKeys } from '@/lib/query-keys';
import { reportService } from '../api/report-service';

export function useProjectReport(projectId: string) {
  return useAppQuery({
    queryKey: queryKeys.reports.project(projectId),
    queryFn: () => reportService.getProjectReport(projectId),
    enabled: !!projectId,
    errorMessage: 'Không thể tải báo cáo dự án',
  });
}
