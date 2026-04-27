import type { WorkflowRuleDTO } from '@superboard/shared';
import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type AutomationPulseResult = {
  healed: number;
  nudged: number;
};

export type AutomationProposal = {
  id: string;
  actionType: string;
  reason: string;
  metadata: Record<string, unknown>;
};

export type AgentLog = {
  id: string;
  agentName: string;
  actionType: string;
  targetId: string;
  reason: string;
  createdAt: string;
};

export type HealthAction = AgentLog & {
  metadata?: Record<string, unknown>;
};

export type ExecutiveDirectiveData = {
  id: string;
  reason: string;
  metadata: Record<string, unknown>;
};

export type ConsciousnessPulse = {
  id: string;
  metadata: {
    thoughts: string[];
    timestamp: string;
  };
};

export const getAutomationRules = (workspaceId: string, projectId?: string) =>
  authApi.get<WorkflowRuleDTO[]>(API_ENDPOINTS.automation.rules, {
    params: { workspaceId, projectId },
  });

export const generateAutomationRule = (prompt: string) =>
  authApi.post<Partial<WorkflowRuleDTO>>(API_ENDPOINTS.automation.generateRule, { prompt });

export const createAutomationRule = (payload: Record<string, unknown>) =>
  authApi.post<WorkflowRuleDTO>(API_ENDPOINTS.automation.rules, payload);

export const updateAutomationRule = (ruleId: string, payload: Partial<WorkflowRuleDTO>) =>
  authApi.patch<WorkflowRuleDTO>(API_ENDPOINTS.automation.rule(ruleId), payload);

export const deleteAutomationRule = (ruleId: string) =>
  authApi.delete<void>(API_ENDPOINTS.automation.rule(ruleId), { responseType: 'void' });

export const triggerAutomationPulse = (workspaceId: string) =>
  authApi.post<AutomationPulseResult>(API_ENDPOINTS.automation.pulse, undefined, {
    params: { workspaceId },
  });

export const getAutomationProposals = (workspaceId: string) =>
  authApi.get<AutomationProposal[]>(API_ENDPOINTS.automation.proposals, {
    params: { workspaceId },
  });

export const approveAutomationProposal = (proposalId: string) =>
  authApi.post<void>(API_ENDPOINTS.automation.approveProposal(proposalId), undefined, {
    responseType: 'void',
  });

export const getAutomationHealth = (workspaceId: string) =>
  authApi.get<{ actions: HealthAction[] }>(API_ENDPOINTS.automation.health, {
    params: { workspaceId },
  });

export const healWorkspace = (workspaceId: string) =>
  authApi.post<{ archived: number }>(API_ENDPOINTS.automation.heal, undefined, {
    params: { workspaceId },
  });

export const getAgentLogs = (workspaceId: string, projectId?: string) =>
  authApi.get<{ logs: AgentLog[] }>(API_ENDPOINTS.automation.agentLogs, {
    params: { workspaceId, projectId },
  });

export const getExecutiveDirective = (workspaceId: string) =>
  authApi.get<ExecutiveDirectiveData>(API_ENDPOINTS.automation.executiveDirective, {
    params: { workspaceId },
  });

export const executeExecutiveDirective = (directiveId: string) =>
  authApi.post<void>(API_ENDPOINTS.automation.executeExecutiveDirective(directiveId), undefined, {
    responseType: 'void',
  });

export const getConsciousnessStream = (workspaceId: string) =>
  authApi.get<ConsciousnessPulse[]>(API_ENDPOINTS.automation.consciousnessStream, {
    params: { workspaceId },
  });
