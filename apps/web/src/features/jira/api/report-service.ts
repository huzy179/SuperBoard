import { api } from '@/lib/api';
import type { ProjectReportResponseDTO } from '@superboard/shared';

export const reportService = {
  getProjectReport: async (projectId: string): Promise<ProjectReportResponseDTO> => {
    const response = await api.get<ProjectReportResponseDTO>(`/v1/projects/${projectId}/reports`);
    return response.data;
  },

  exportTasksCsv: (projectId: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/projects/${projectId}/export`;
    window.open(url, '_blank');
  },

  exportTasksJson: (projectId: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/projects/${projectId}/export/json`;
    window.open(url, '_blank');
  },
};
