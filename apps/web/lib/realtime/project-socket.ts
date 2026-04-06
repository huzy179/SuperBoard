import { io, type Socket } from 'socket.io-client';

const socketsByProjectId = new Map<string, Socket>();

function resolveSocketUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envApiUrl) {
    try {
      const parsed = new URL(envApiUrl, window.location.origin);
      return parsed.origin;
    } catch {
      return window.location.origin;
    }
  }

  return window.location.origin;
}

function getProjectSocket(projectId: string): Socket | null {
  if (typeof window === 'undefined' || !projectId) {
    return null;
  }

  const cached = socketsByProjectId.get(projectId);
  if (cached) {
    return cached;
  }

  const socket = io(resolveSocketUrl(), {
    path: '/socket.io',
    transports: ['websocket'],
    withCredentials: true,
    query: { projectId },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
  });

  socketsByProjectId.set(projectId, socket);
  return socket;
}

export function subscribeProjectSocketUpdated(
  projectId: string,
  onProjectUpdated: () => void,
): () => void {
  const socket = getProjectSocket(projectId);

  if (!socket) {
    return () => {};
  }

  const listener = (payload: { projectId?: string }) => {
    if (payload?.projectId !== projectId) {
      return;
    }

    onProjectUpdated();
  };

  socket.on('project:updated', listener);
  socket.emit('project:join', { projectId });

  return () => {
    socket.off('project:updated', listener);
  };
}

export function subscribeProjectPresence(
  projectId: string,
  onPresence: (payload: { projectId: string; viewerCount: number; at: number }) => void,
): () => void {
  const socket = getProjectSocket(projectId);

  if (!socket) {
    return () => {};
  }

  const listener = (payload: { projectId?: string; viewerCount?: number; at?: number }) => {
    if (payload?.projectId !== projectId || typeof payload.viewerCount !== 'number') {
      return;
    }

    onPresence({
      projectId,
      viewerCount: payload.viewerCount,
      at: typeof payload.at === 'number' ? payload.at : Date.now(),
    });
  };

  socket.on('project:presence', listener);
  socket.emit('project:join', { projectId });

  return () => {
    socket.off('project:presence', listener);
  };
}

export function subscribeProjectTaskPatched(
  projectId: string,
  onTaskPatched: (payload: {
    projectId: string;
    taskId: string;
    status: string;
    position?: string | null;
    updatedAt: string;
    at: number;
  }) => void,
): () => void {
  const socket = getProjectSocket(projectId);

  if (!socket) {
    return () => {};
  }

  const listener = (payload: {
    projectId?: string;
    taskId?: string;
    status?: string;
    position?: string | null;
    updatedAt?: string;
    at?: number;
  }) => {
    if (
      payload?.projectId !== projectId ||
      !payload.taskId ||
      !payload.status ||
      !payload.updatedAt
    ) {
      return;
    }

    onTaskPatched({
      projectId,
      taskId: payload.taskId,
      status: payload.status,
      ...(payload.position !== undefined ? { position: payload.position } : {}),
      updatedAt: payload.updatedAt,
      at: typeof payload.at === 'number' ? payload.at : Date.now(),
    });
  };

  socket.on('project:task-patched', listener);
  socket.emit('project:join', { projectId });

  return () => {
    socket.off('project:task-patched', listener);
  };
}

export function subscribeTaskComments(
  projectId: string,
  onCommentEvent: (payload: {
    type: 'added' | 'updated' | 'deleted';
    taskId: string;
    commentId: string;
    authorName?: string;
    content?: string;
    createdAt?: string;
    updatedAt?: string;
  }) => void,
): () => void {
  const socket = getProjectSocket(projectId);

  if (!socket) {
    return () => {};
  }

  const handleAdded = (payload: {
    taskId: string;
    commentId: string;
    authorName: string;
    content: string;
    createdAt: string;
  }) => {
    onCommentEvent({ type: 'added', ...payload });
  };
  const handleUpdated = (payload: {
    taskId: string;
    commentId: string;
    content: string;
    updatedAt: string;
  }) => {
    onCommentEvent({ type: 'updated', ...payload });
  };
  const handleDeleted = (payload: { taskId: string; commentId: string }) => {
    onCommentEvent({ type: 'deleted', ...payload });
  };

  socket.on('comment:added', handleAdded);
  socket.on('comment:updated', handleUpdated);
  socket.on('comment:deleted', handleDeleted);
  socket.emit('project:join', { projectId });

  return () => {
    socket.off('comment:added', handleAdded);
    socket.off('comment:updated', handleUpdated);
    socket.off('comment:deleted', handleDeleted);
  };
}
