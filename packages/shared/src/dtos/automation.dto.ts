export interface WorkflowRuleDTO {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  name: string;
  description?: string | null;
  isActive: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
}

export type WorkflowTriggerType =
  | 'TASK_CREATED'
  | 'STATUS_CHANGED'
  | 'ASSIGNEE_CHANGED'
  | 'SEMANTIC_MATCH';

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  config?: Record<string, unknown>; // e.g., { from: "todo", to: "done" }
}

export type WorkflowActionType =
  | 'SEND_NOTIFICATION'
  | 'UPDATE_TASK_FIELD'
  | 'ADD_LABEL'
  | 'AI_EVALUATE'
  | 'AUTO_ASSIGN'
  | 'SEND_WEBHOOK';

export interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, unknown>; // e.g., { userId: "...", message: "Task {{title}} done" }
}

export interface CreateWorkflowRuleDTO {
  name: string;
  description?: string;
  projectId?: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
}

export interface UpdateWorkflowRuleDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  trigger?: WorkflowTrigger;
  actions?: WorkflowAction[];
}
