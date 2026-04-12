export interface DocItemDTO {
  id: string;
  workspaceId: string;
  title: string;
  parentDocId: string | null;
  createdById: string;
  lastEditedBy: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
}
