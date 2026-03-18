import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUserDTO } from '@superboard/shared';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../../modules/auth/auth.service';

type RequestWithUser = {
  headers: {
    authorization?: string;
  };
  user?: AuthUserDTO;
};

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = await this.authService.getMeFromToken(authorization);
    return true;
  }
}
