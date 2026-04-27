import 'reflect-metadata';
import { AppModule } from './app.module';
import { NestBootstrap } from '@superboard/backend-shared/bootstrap';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type AppEnv } from './config/env';

async function bootstrap() {
  const sharedConfig = new SharedConfigService<AppEnv>({
    schema: envSchema,
    validateOnLoad: true,
  });

  await NestBootstrap.bootstrap(AppModule, {
    service: { name: 'api-service', version: '0.1.0' },
    config: {
      port: sharedConfig.get('PORT') ?? 4000,
      cors: {
        origin: sharedConfig.get('FRONTEND_URL') ?? 'http://localhost:3000',
        credentials: true,
      },
    },
    middleware: { correlationId: true },
  });
}

bootstrap();
