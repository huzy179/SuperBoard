import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import type { Doc, DocVersion } from '@superboard/shared';

export async function getWorkspaceDocs(workspaceId: string): Promise<Doc[]> {
  return apiGet<Doc[]>(API_ENDPOINTS.docs.list(workspaceId), { auth: true });
}

export async function getDocDetail(docId: string): Promise<Doc> {
  return apiGet<Doc>(API_ENDPOINTS.docs.detail(docId), { auth: true });
}

export async function createDoc(
  workspaceId: string,
  data: {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: any;
    parentDocId?: string;
  },
): Promise<Doc> {
  return apiPost<Doc>(API_ENDPOINTS.docs.create(workspaceId), data, { auth: true });
}

export async function updateDoc(
  docId: string,
  data: {
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: any;
  },
): Promise<Doc> {
  return apiPut<Doc>(API_ENDPOINTS.docs.update(docId), data, { auth: true });
}

export async function deleteDoc(docId: string): Promise<void> {
  return apiDelete(API_ENDPOINTS.docs.delete(docId), { auth: true });
}

export async function getDocVersions(docId: string): Promise<DocVersion[]> {
  return apiGet<DocVersion[]>(API_ENDPOINTS.docs.versions(docId), { auth: true });
}
