import 'reflect-metadata';
import { AppModule } from './app.module';
import { NestBootstrap } from '@superboard/backend-shared/bootstrap';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type CollaborationEnv } from './config/env';

async function bootstrap() {
  const sharedConfig = new SharedConfigService<CollaborationEnv>({
    schema: envSchema,
    validateOnLoad: true,
  });

  await NestBootstrap.bootstrap(AppModule, {
    service: { name: 'collaboration-service', version: '0.1.0' },
    config: {
      port: sharedConfig.get('PORT') ?? 3001,
      cors: {
        origin: sharedConfig.get('FRONTEND_URL') ?? 'http://localhost:3000',
        credentials: true,
      },
    },
    middleware: { correlationId: true },
  });
}

bootstrap();
