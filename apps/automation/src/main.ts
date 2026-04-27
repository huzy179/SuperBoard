import 'reflect-metadata';
import { AppModule } from './app.module';
import { NestBootstrap } from '@superboard/backend-shared/bootstrap';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type AutomationEnv } from './config/env';

async function bootstrap() {
  const sharedConfig = new SharedConfigService<AutomationEnv>({
    schema: envSchema,
    validateOnLoad: true,
  });

  await NestBootstrap.bootstrap(AppModule, {
    service: { name: 'automation-service', version: '0.1.0' },
    config: { port: sharedConfig.get('PORT') ?? 3004 },
    middleware: { correlationId: true },
  });
}

bootstrap();
