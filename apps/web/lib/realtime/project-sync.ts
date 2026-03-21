const PROJECT_SYNC_CHANNEL = 'superboard-project-sync';

type ProjectDetailUpdatedEvent = {
  type: 'project-detail-updated';
  projectId: string;
  sourceId: string;
  at: number;
};

type ProjectSyncEvent = ProjectDetailUpdatedEvent;

const sourceId =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Math.random().toString(36).slice(2)}`;

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }

  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(PROJECT_SYNC_CHANNEL);
  }

  return broadcastChannel;
}

export function publishProjectDetailUpdated(projectId: string) {
  if (!projectId) {
    return;
  }

  const channel = getBroadcastChannel();
  if (!channel) {
    return;
  }

  const event: ProjectSyncEvent = {
    type: 'project-detail-updated',
    projectId,
    sourceId,
    at: Date.now(),
  };

  channel.postMessage(event);
}

export function subscribeProjectDetailUpdated(
  projectId: string,
  onProjectUpdated: () => void,
): () => void {
  const channel = getBroadcastChannel();

  if (!channel) {
    return () => {};
  }

  const handler = (message: MessageEvent<ProjectSyncEvent>) => {
    const event = message.data;

    if (
      event.type !== 'project-detail-updated' ||
      event.projectId !== projectId ||
      event.sourceId === sourceId
    ) {
      return;
    }

    onProjectUpdated();
  };

  channel.addEventListener('message', handler);

  return () => {
    channel.removeEventListener('message', handler);
  };
}
