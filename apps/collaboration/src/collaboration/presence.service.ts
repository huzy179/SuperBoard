import { Injectable } from '@nestjs/common';
import { RedisAdapterService } from './redis-adapter.service';

const PRESENCE_TTL_SECONDS = 60; // 60s TTL — refreshed on activity

export interface PresenceState {
  userId: string;
  workspaceId?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
}

@Injectable()
export class PresenceService {
  constructor(private redisAdapter: RedisAdapterService) {}

  private presenceKey(channelType: string, channelId: string, userId: string): string {
    return `presence:${channelType}:${channelId}:${userId}`;
  }

  async setPresence(
    channelType: string,
    channelId: string,
    userId: string,
    status: 'online' | 'offline' | 'away',
  ): Promise<void> {
    const key = this.presenceKey(channelType, channelId, userId);
    const value: PresenceState = {
      userId,
      status,
      lastSeen: new Date().toISOString(),
    };

    if (status === 'offline') {
      await this.redisAdapter.pubClient.del(key);
    } else {
      await this.redisAdapter.pubClient.setex(key, PRESENCE_TTL_SECONDS, JSON.stringify(value));
    }
  }

  async getPresence(
    channelType: string,
    channelId: string,
    userId: string,
  ): Promise<PresenceState | null> {
    const key = this.presenceKey(channelType, channelId, userId);
    const raw = await this.redisAdapter.pubClient.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as PresenceState;
  }
}
