import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { AuthUserDTO, UpdateProfileRequestDTO } from '@superboard/shared';
import type { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logger } from '../../common/logger';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: AuthUserDTO }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim(), deletedAt: null },
    });

    if (!user || !user.isActive) {
      logger.warn({ email }, 'Login failed: user not found or inactive');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      logger.warn({ userId: user.id }, 'Login failed: invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info({ userId: user.id, email: user.email }, 'Login success');
    const accessToken = this.signAccessToken({ sub: user.id, email: user.email });

    return {
      accessToken,
      user: this.toAuthUser(user),
    };
  }

  async getMeFromToken(authorizationHeader?: string): Promise<AuthUserDTO> {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const payload = this.verifyAccessToken(token);

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub, deletedAt: null } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.toAuthUser(user);
  }

  async updateProfile(userId: string, data: UpdateProfileRequestDTO): Promise<AuthUserDTO> {
    const updateData: Prisma.UserUpdateInput = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    logger.info({ userId }, 'Profile updated');
    return this.toAuthUser(user);
  }

  hashPassword(rawPassword: string): string {
    const normalized = rawPassword.normalize('NFKC');
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(normalized, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private signAccessToken(payload: JwtPayload): string {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const signOptions: jwt.SignOptions = {
      algorithm: 'HS256',
      expiresIn: '1d',
      jwtid: createHash('sha256').update(`${payload.sub}:${Date.now()}`).digest('hex'),
    };

    return jwt.sign(payload, secret, signOptions);
  }

  private verifyAccessToken(token: string): JwtPayload {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    const decoded = jwt.verify(token, secret);

    if (typeof decoded !== 'object' || !decoded || typeof decoded.sub !== 'string') {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      sub: decoded.sub,
      email: typeof decoded.email === 'string' ? decoded.email : '',
    };
  }

  private verifyPassword(rawPassword: string, stored: string): boolean {
    const [salt, expectedHash] = stored.split(':');
    if (!salt || !expectedHash) {
      return false;
    }

    const normalized = rawPassword.normalize('NFKC');
    const calculatedHash = scryptSync(normalized, salt, 64).toString('hex');

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const calculatedBuffer = Buffer.from(calculatedHash, 'hex');

    if (expectedBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, calculatedBuffer);
  }

  private toAuthUser(user: User): AuthUserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl ?? null,
      avatarColor: user.avatarColor ?? null,
      defaultWorkspaceId: user.defaultWorkspaceId ?? null,
    };
  }
}
