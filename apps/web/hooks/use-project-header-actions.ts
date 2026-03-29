import { useCallback, useEffect, useState } from 'react';
import { subscribeProjectPresence } from '@/lib/realtime/project-socket';

export function useProjectHeaderActions(projectId: string) {
  const [viewerCount, setViewerCount] = useState(1);
  const [isCopyLinkSuccess, setIsCopyLinkSuccess] = useState(false);

  useEffect(() => {
    if (projectId) {
      const unsubscribe = subscribeProjectPresence(projectId, (presence) => {
        setViewerCount(presence.viewerCount);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [projectId]);

  const onCopyFilterLink = useCallback(() => {
    const url = window.location.href;
    void navigator.clipboard.writeText(url).then(() => {
      setIsCopyLinkSuccess(true);
      setTimeout(() => setIsCopyLinkSuccess(false), 2000);
    });
  }, []);

  const onOpenFilterInNewTab = useCallback(() => {
    window.open(window.location.href, '_blank');
  }, []);

  return {
    viewerCount,
    isCopyLinkSuccess,
    onCopyFilterLink,
    onOpenFilterInNewTab,
  };
}
