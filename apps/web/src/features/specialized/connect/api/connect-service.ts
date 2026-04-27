import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type IntegrationItem = {
  id: string;
  name: string;
  provider: 'SLACK' | 'GITHUB' | 'DISCORD' | 'GITLAB' | 'ZAPIER';
  type: string;
  status: string;
  createdAt: string;
};

export const getIntegrations = (workspaceId: string) =>
  authApi.get<{ integrations: IntegrationItem[] }>(API_ENDPOINTS.connect.integrations, {
    params: { workspaceId },
  });

export const disconnectIntegration = (workspaceId: string, integrationId: string) =>
  authApi.delete<void>(API_ENDPOINTS.connect.integration(integrationId), {
    params: { workspaceId },
    responseType: 'void',
  });
