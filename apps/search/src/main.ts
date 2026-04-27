import 'reflect-metadata';
import { AppModule } from './app.module';
import { NestBootstrap } from '@superboard/backend-shared/bootstrap';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type SearchEnv } from './config/env';

async function bootstrap() {
  const sharedConfig = new SharedConfigService<SearchEnv>({
    schema: envSchema,
    validateOnLoad: true,
  });

  await NestBootstrap.bootstrap(AppModule, {
    service: { name: 'search-service', version: '0.1.0' },
    config: { port: sharedConfig.get('PORT') ?? 3003 },
    middleware: { correlationId: true },
  });
}

bootstrap();
