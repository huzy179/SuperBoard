import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './common/logger';
import { requestContextMiddleware } from './common/request-context.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestContextMiddleware);
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;

  await app.listen(port);
  logger.info({ port }, 'api.started');
}

bootstrap();
