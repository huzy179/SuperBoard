import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocDetail,
  updateDoc,
  getDocVersions,
  getWorkspaceDocs,
  createDoc,
} from '@/features/docs/api/doc-service';
import { toast } from 'sonner';
import type { Doc, DocVersion } from '@superboard/shared';
import { useDebounce } from '@/hooks/use-debounce';
import { useEffect, useRef, useState } from 'react';

export function useWorkspaceDocs(workspaceId: string | undefined) {
  return useQuery<Doc[]>({
    queryKey: ['docs', workspaceId],
    queryFn: () => getWorkspaceDocs(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useDoc(docId: string | undefined) {
  const queryClient = useQueryClient();
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState<unknown>(null);
  const lastSavedRef = useRef<string | null>(null);

  const query = useQuery<Doc>({
    queryKey: ['doc', docId],
    queryFn: () => getDocDetail(docId!),
    enabled: !!docId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { title?: string; content?: unknown; parentDocId?: string }) =>
      updateDoc(docId!, data),
    onSuccess: (updatedDoc) => {
      queryClient.setQueryData(['doc', docId], updatedDoc);
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
      void queryClient.invalidateQueries({ queryKey: ['doc-versions', docId] });

      lastSavedRef.current = JSON.stringify({
        title: updatedDoc.title,
        content: updatedDoc.content,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi khi lưu tài liệu');
    },
  });

  // Sync initial data from query to local state
  useEffect(() => {
    if (query.data) {
      setLocalTitle(query.data.title);
      setLocalContent(query.data.content);
      lastSavedRef.current = JSON.stringify({
        title: query.data.title,
        content: query.data.content,
      });
    }
  }, [query.data]);

  // Handle debounced auto-save
  const debouncedData = useDebounce({ title: localTitle, content: localContent }, 2000);

  useEffect(() => {
    if (!docId || !debouncedData || !query.data) return;

    const currentSerialized = JSON.stringify(debouncedData);
    if (currentSerialized !== lastSavedRef.current) {
      updateMutation.mutate(debouncedData);
    }
  }, [debouncedData, docId, query.data]);

  return {
    ...query,
    localTitle,
    setLocalTitle,
    localContent,
    setLocalContent,
    updateDoc: updateMutation.mutate,
    isSaving: updateMutation.isPending,
  };
}

export function useDocVersions(docId: string | undefined) {
  return useQuery<DocVersion[]>({
    queryKey: ['doc-versions', docId],
    queryFn: () => getDocVersions(docId!),
    enabled: !!docId,
  });
}

export function useCreateDoc(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; parentDocId?: string }) => createDoc(workspaceId!, data),
    onSuccess: () => {
      toast.success('Đã tạo tài liệu mới');
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
    },
  });
}
