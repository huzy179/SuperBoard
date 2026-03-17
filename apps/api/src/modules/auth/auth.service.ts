import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
};

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  defaultWorkspaceId: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string; user: AuthUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = this.signAccessToken({ sub: user.id, email: user.email });

    return {
      accessToken,
      user: this.toAuthUser(user),
    };
  }

  async getMeFromToken(authorizationHeader?: string): Promise<AuthUser> {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const payload = this.verifyAccessToken(token);

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid token');
    }

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

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      defaultWorkspaceId: user.defaultWorkspaceId ?? null,
    };
  }
}
