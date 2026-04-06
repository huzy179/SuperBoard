import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocDetail, updateDoc } from '@/lib/services/doc-service';
import type { Doc } from '@superboard/shared';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { useEffect, useRef, useState } from 'react';

export function useDoc(docId: string | undefined) {
  const queryClient = useQueryClient();
  const [localTitle, setLocalTitle] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localContent, setLocalContent] = useState<any>(null);
  const lastSavedRef = useRef<string | null>(null);

  const query = useQuery<Doc>({
    queryKey: ['doc', docId],
    queryFn: () => getDocDetail(docId!),
    enabled: !!docId,
  });

  const updateMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (data: { title?: string; content?: any }) => updateDoc(docId!, data),
    onSuccess: (updatedDoc) => {
      // Invalidate the docs list to update the sidebar titles
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
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
    if (!docId || !debouncedData) return;

    const currentSerialized = JSON.stringify(debouncedData);
    if (currentSerialized !== lastSavedRef.current) {
      updateMutation.mutate(debouncedData);
    }
  }, [debouncedData, docId, updateMutation]);

  return {
    ...query,
    localTitle,
    setLocalTitle,
    localContent,
    setLocalContent,
    isSaving: updateMutation.isPending,
  };
}
