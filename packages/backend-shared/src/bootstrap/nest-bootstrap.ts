import type { INestApplication, LogLevel, LoggerService, Type } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NextFunction, Request, Response } from 'express';
import type { BootstrapConfig } from '../types';
import type { MiddlewareConfig, ServiceInfo, ShutdownHook } from './types';
import { GlobalExceptionFilter } from '../errors/filters';

export interface NestBootstrapOptions {
  service: ServiceInfo;
  config?: BootstrapConfig;
  middleware?: MiddlewareConfig;
  shutdownHooks?: ShutdownHook[];
  validateDependencies?: () => Promise<void>;
}

function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-correlation-id'];
  const correlationId =
    (Array.isArray(incoming) ? incoming[0] : incoming) ??
    globalThis.crypto?.randomUUID?.() ??
    `corr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}

export class NestBootstrap {
  static async bootstrap<TModule>(
    module: Type<TModule>,
    options: NestBootstrapOptions,
  ): Promise<INestApplication> {
    const logger = new Logger(`Bootstrap:${options.service.name}`);
    const app = await NestFactory.create(module, {
      logger: options.config?.logger as LoggerService | LogLevel[] | false,
    });

    // Standardized error responses
    app.useGlobalFilters(new GlobalExceptionFilter());

    if (options.middleware?.correlationId) {
      app.use(correlationIdMiddleware);
    }

    if (options.config?.globalPrefix) {
      app.setGlobalPrefix(options.config.globalPrefix);
    }

    if (options.config?.cors) {
      app.enableCors(options.config.cors as CorsOptions);
    }

    app.enableShutdownHooks();

    if (options.validateDependencies) {
      await options.validateDependencies();
    }

    const port = resolveListenPort(options.config?.port, process.env.PORT);
    await app.listen(port);

    logger.log(`${options.service.name} started on port ${port}`);

    // Best-effort custom shutdown hooks
    const hooks = (options.shutdownHooks ?? []).slice().sort((a, b) => a.priority - b.priority);
    if (hooks.length > 0) {
      const runHooks = async (): Promise<void> => {
        for (const hook of hooks) {
          try {
            await hook.execute();
          } catch (error) {
            logger.error(`Shutdown hook '${hook.name}' failed: ${(error as Error).message}`);
          }
        }
      };

      process.once('SIGTERM', () => void runHooks());
      process.once('SIGINT', () => void runHooks());
    }

    return app;
  }
}

export function resolveListenPort(configPort?: number, envPort?: string): number {
  if (typeof configPort === 'number' && Number.isFinite(configPort) && configPort > 0)
    return configPort;
  const parsed = envPort ? Number(envPort) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 3000;
}
