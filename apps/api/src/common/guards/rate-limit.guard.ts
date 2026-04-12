import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../redis.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { logger } from '../logger';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options || !this.redisService.isEnabled()) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip;
    
    // Create a unique key based on User ID or IP + Endpoint
    const identifier = user?.id || ip || 'anonymous';
    const handlerName = context.getHandler().name;
    const className = context.getClass().name;
    const cacheKey = `rate_limit:${identifier}:${className}:${handlerName}`;

    try {
      const redis = this.redisService.getClient();
      
      // Use Redis INCR and handle TTL
      const current = await redis.incr(cacheKey);
      
      if (current === 1) {
        // First request in this window, set expiration
        await redis.expire(cacheKey, options.ttl);
      }

      if (current > options.limit) {
        logger.warn(
          { identifier, handlerName, current, limit: options.limit },
          'Rate limit exceeded',
        );
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Bạn đang thao tác quá nhanh. Vui lòng thử lại sau giây lát.',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) throw err;
      
      // Fail-open strategy: Log error but allow request if Redis fails
      logger.error({ err, cacheKey }, 'Rate limiting error, failing open');
      return true;
    }

    return true;
  }
}
