import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MentionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Extracts unique usernames from text starting with @
   * Example: "Hi @alice and @bob" -> ["alice", "bob"]
   */
  extractMentions(text: string): string[] {
    const regex = /\B@(\w+)/g;
    const matches = text.matchAll(regex);
    const usernames = new Set<string>();

    for (const match of matches) {
      if (match[1]) {
        usernames.add(match[1].toLowerCase());
      }
    }

    return Array.from(usernames);
  }

  /**
   * Resolves usernames to actual users who are members of the given workspace.
   */
  async resolveMentions(usernames: string[], workspaceId: string) {
    if (usernames.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        username: { in: usernames },
        memberships: {
          some: { workspaceId },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
      },
    });

    return users;
  }

  /**
   * Ensure the current user has a username (sync from email prefix if missing)
   */
  async ensureUsername(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });

    if (user && !user.username) {
      const prefix =
        user.email
          .split('@')[0]
          ?.toLowerCase()
          .replace(/[^a-z0-9_]/g, '') || `user_${user.id.slice(-4)}`;

      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { username: prefix },
        });
      } catch {
        // Handle potential collisions by appending random suffix
        await this.prisma.user.update({
          where: { id: userId },
          data: { username: `${prefix}_${Math.floor(Math.random() * 1000)}` },
        });
      }
    }
  }
}
