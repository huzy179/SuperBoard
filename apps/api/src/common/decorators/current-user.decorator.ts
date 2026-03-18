import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthUserDTO } from '@superboard/shared';

type RequestWithUser = {
  user?: AuthUserDTO;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserDTO => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    return request.user;
  },
);
