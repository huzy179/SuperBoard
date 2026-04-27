import type { WorkflowRuleDTO } from '@superboard/shared';
import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import { useAppQuery } from '@/lib/hooks/use-app-query';
import { queryKeys } from '@/lib/query-keys';
import {
  createAutomationRule,
  deleteAutomationRule,
  getAutomationRules,
  updateAutomationRule,
} from '../api/automation-service';

export function useAutomationRules(workspaceId: string, projectId?: string) {
  return useAppQuery({
    queryKey: queryKeys.automation.rules(workspaceId, projectId),
    queryFn: () => getAutomationRules(workspaceId, projectId),
    enabled: !!workspaceId,
    errorMessage: 'Không thể tải quy tắc tự động hóa',
  });
}

export function useCreateAutomationRule(workspaceId: string, projectId?: string) {
  return useAppMutation<WorkflowRuleDTO, Error, Record<string, unknown>>({
    mutationFn: createAutomationRule,
    invalidateKeys: [queryKeys.automation.rules(workspaceId, projectId)],
    successMessage: 'Đã tạo quy tắc thành công',
  });
}

export function useToggleAutomationRule(workspaceId: string, projectId?: string) {
  return useAppMutation<WorkflowRuleDTO, Error, WorkflowRuleDTO>({
    mutationFn: (rule) => updateAutomationRule(rule.id, { isActive: !rule.isActive }),
    invalidateKeys: [queryKeys.automation.rules(workspaceId, projectId)],
    successMessage: 'Đã cập nhật trạng thái',
  });
}

export function useDeleteAutomationRule(workspaceId: string, projectId?: string) {
  return useAppMutation<void, Error, string>({
    mutationFn: deleteAutomationRule,
    invalidateKeys: [queryKeys.automation.rules(workspaceId, projectId)],
    successMessage: 'Đã xóa rule',
  });
}
