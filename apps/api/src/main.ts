import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './common/logger';
import { requestContextMiddleware } from './common/request-context.middleware';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type AppEnv } from './config/env';

async function bootstrap() {
  const sharedConfig = new SharedConfigService<AppEnv>({
    schema: envSchema,
    validateOnLoad: true,
  });

  const app = await NestFactory.create(AppModule);
  app.use(requestContextMiddleware);

  app.enableCors({
    origin: sharedConfig.get('FRONTEND_URL') ?? 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  const port = sharedConfig.get('PORT') ?? 4000;

  await app.listen(port);
  logger.info({ port }, 'api.started');
}

bootstrap();
