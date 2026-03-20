import { useQuery } from '@tanstack/react-query';
import type { DashboardStatsDTO } from '@superboard/shared';
import { getDashboardStats } from '@/lib/services/project-service';

export function useDashboardStats() {
  return useQuery<DashboardStatsDTO>({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });
}
