export interface ProjectUpdatedPayload {
  projectId: string;
  workspaceId: string;
  updatedBy: string;
  changes: Record<string, unknown>;
}
