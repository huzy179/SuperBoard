import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';

type PrismaMock = Record<string, unknown>;

describe('AuthService', () => {
  it('login throws UnauthorizedException when user not found', async () => {
    const prisma = {
      user: {
        findUnique: async () => null,
      },
    } satisfies PrismaMock;

    const configService = {
      getOrThrow: (key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        throw new Error(`Unknown key: ${key}`);
      },
    };

    const service = new AuthService(prisma as never, configService as never);

    await assert.rejects(
      async () => service.login('unknown@test.com', 'password'),
      UnauthorizedException,
    );
  });

  it('login throws UnauthorizedException when user is inactive', async () => {
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 'user-1',
          email: 'inactive@test.com',
          isActive: false,
        }),
      },
    } satisfies PrismaMock;

    const configService = {
      getOrThrow: (key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        throw new Error(`Unknown key: ${key}`);
      },
    };

    const service = new AuthService(prisma as never, configService as never);

    await assert.rejects(
      async () => service.login('inactive@test.com', 'password'),
      UnauthorizedException,
    );
  });

  it('login throws UnauthorizedException when password is wrong', async () => {
    const prisma = {
      user: {
        findUnique: async () => ({
          id: 'user-1',
          email: 'user@test.com',
          passwordHash: 'salt:0000000000000000000000000000000000000000000000000000000000000000',
          isActive: true,
          fullName: 'Test User',
          avatarColor: null,
          defaultWorkspaceId: null,
        }),
      },
    } satisfies PrismaMock;

    const configService = {
      getOrThrow: (key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        throw new Error(`Unknown key: ${key}`);
      },
    };

    const service = new AuthService(prisma as never, configService as never);

    await assert.rejects(
      async () => service.login('user@test.com', 'wrongpassword'),
      UnauthorizedException,
    );
  });
});
