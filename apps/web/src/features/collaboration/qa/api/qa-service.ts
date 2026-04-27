import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type ManualDiagnosisPayload = {
  message: string;
  stack: string;
  url: string;
};

export const diagnoseManualIssue = (payload: ManualDiagnosisPayload) =>
  authApi.post<{ diagnosis: string }>(API_ENDPOINTS.qa.diagnoseManual, payload);

export const generateTestSpec = (prompt: string) =>
  authApi.post<{ spec: string }>(API_ENDPOINTS.qa.generateSpec, { prompt });
