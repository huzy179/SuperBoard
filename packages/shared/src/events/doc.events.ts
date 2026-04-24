export interface DocUpdatedPayload {
  docId: string;
  projectId: string;
  workspaceId: string;
  updatedBy: string;
  changeType: 'content' | 'title' | 'metadata';
}

export interface DocVersionCreatedPayload {
  docId: string;
  versionId: string;
  projectId: string;
  workspaceId: string;
  createdBy: string;
}
