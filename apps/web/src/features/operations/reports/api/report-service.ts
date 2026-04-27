import { apiGet } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { ProjectReportResponseDTO } from '@superboard/shared';

function openBlob(blob: Blob, filename: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export const reportService = {
  getProjectReport: async (projectId: string): Promise<ProjectReportResponseDTO> => {
    return apiGet<ProjectReportResponseDTO>(API_ENDPOINTS.projects.reports(projectId), {
      auth: true,
    });
  },

  exportTasksCsv: async (projectId: string) => {
    const blob = await apiGet<Blob>(API_ENDPOINTS.projects.export(projectId), {
      auth: true,
      responseType: 'blob',
    });
    openBlob(blob, `project-${projectId}-tasks.csv`);
  },

  exportTasksJson: async (projectId: string) => {
    const blob = await apiGet<Blob>(API_ENDPOINTS.projects.exportJson(projectId), {
      auth: true,
      responseType: 'blob',
    });
    openBlob(blob, `project-${projectId}-tasks.json`);
  },
};
