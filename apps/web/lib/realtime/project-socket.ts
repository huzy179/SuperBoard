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
