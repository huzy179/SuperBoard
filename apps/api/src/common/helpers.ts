import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { AuthUserDTO } from '@superboard/shared';

export function requireWorkspace(user: AuthUserDTO): string {
  if (!user?.defaultWorkspaceId) {
    throw new UnauthorizedException('Workspace not found');
  }
  return user.defaultWorkspaceId;
}

export async function findOrThrow<T>(query: Promise<T | null>, label: string): Promise<T> {
  const result = await query;
  if (!result) {
    throw new NotFoundException(`${label} not found`);
  }
  return result;
}

export function parseBooleanQuery(value?: string): boolean {
  if (value === undefined) return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new BadRequestException('showArchived must be true or false');
}
