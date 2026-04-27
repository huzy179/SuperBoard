# Backend Shared Library - Migration Guide

This guide provides step-by-step instructions for creating new services or migrating existing services to use the `@superboard/backend-shared` library.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating a New Service](#creating-a-new-service)
3. [Migrating an Existing Service](#migrating-an-existing-service)
4. [Common Patterns](#common-patterns)
5. [Troubleshooting](#troubleshooting)

## Quick Start

The fastest way to create a new service is to follow this template:

```bash
# 1. Create service directory
mkdir apps/my-service
cd apps/my-service

# 2. Initialize package.json
npm init -y

# 3. Install dependencies
npm install @nestjs/common @nestjs/core @nestjs/config reflect-metadata
npm install @superboard/backend-shared @superboard/shared
npm install -D @nestjs/cli typescript ts-node

# 4. Create basic structure
mkdir -p src/{config,health,metrics}
```

## Creating a New Service

### Step 1: Project Structure

Create the following directory structure:

```
apps/my-service/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── config/
│   │   ├── env.ts
│   │   └── shared-config.module.ts
│   ├── health/
│   │   └── health.module.ts
│   ├── metrics/
│   │   └── metrics.module.ts
│   └── [service-specific modules]
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Step 2: Configuration

#### Create `src/config/env.ts`

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Add service-specific variables
  RABBITMQ_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().min(1).optional(),
});

export type MyServiceEnv = z.infer<typeof envSchema>;
export { envSchema };

export function validateEnv(config: Record<string, unknown>): MyServiceEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }
  return result.data;
}
```

#### Create `src/config/shared-config.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type MyServiceEnv } from './env';

export const MY_SERVICE_CONFIG = Symbol('MY_SERVICE_CONFIG');

@Module({
  providers: [
    {
      provide: MY_SERVICE_CONFIG,
      useFactory: () =>
        new SharedConfigService<MyServiceEnv>({
          schema: envSchema,
          validateOnLoad: true,
        }),
    },
  ],
  exports: [MY_SERVICE_CONFIG],
})
export class SharedConfigModule {}
```

### Step 3: Health Checks

#### Create `src/health/health.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPoolManager } from '@superboard/backend-shared/connections';
import {
  HealthCheckController,
  HealthCheckService,
  RedisHealthIndicator,
} from '@superboard/backend-shared/health';

@Module({
  controllers: [HealthCheckController],
  providers: [
    RedisPoolManager,
    {
      provide: HealthCheckService,
      useFactory: (config: ConfigService, redisPool: RedisPoolManager) => {
        const health = new HealthCheckService({
          service: 'my-service',
          version: config.get<string>('npm_package_version') ?? '0.1.0',
        });

        const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const parsed = new URL(redisUrl);

        health.registerIndicator(
          new RedisHealthIndicator('redis', redisPool, {
            host: parsed.hostname,
            port: Number(parsed.port || 6379),
            password: parsed.password || undefined,
            db: 0,
            maxRetriesPerRequest: 1,
          }),
        );

        return health;
      },
      inject: [ConfigService, RedisPoolManager],
    },
  ],
})
export class HealthModule {}
```

### Step 4: Metrics

#### Create `src/metrics/metrics.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MetricsController, MetricsService } from '@superboard/backend-shared/metrics';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
```

### Step 5: Application Module

#### Create `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedConfigModule } from './config/shared-config.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { validateEnv } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    SharedConfigModule,
    HealthModule,
    MetricsModule,
    // Add service-specific modules here
  ],
})
export class AppModule {}
```

### Step 6: Bootstrap

#### Create `src/main.ts`

```typescript
import 'reflect-metadata';
import { AppModule } from './app.module';
import { NestBootstrap } from '@superboard/backend-shared/bootstrap';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type MyServiceEnv } from './config/env';

async function bootstrap() {
  const sharedConfig = new SharedConfigService<MyServiceEnv>({
    schema: envSchema,
    validateOnLoad: true,
  });

  await NestBootstrap.bootstrap(AppModule, {
    service: { name: 'my-service', version: '0.1.0' },
    config: { port: sharedConfig.get('PORT') ?? 3000 },
    middleware: { correlationId: true },
  });
}

bootstrap();
```

### Step 7: AMQP Consumer (Optional)

If your service needs to consume messages from RabbitMQ:

#### Create `src/amqp/my-consumer.service.ts`

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseAMQPConsumer } from '@superboard/backend-shared/amqp';
import type { MessageProcessingContext } from '@superboard/backend-shared/amqp';
import { MetricsService } from '@superboard/backend-shared/metrics';
import type { DomainEvent } from '@superboard/shared';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';

@Injectable()
export class MyConsumerService
  extends BaseAMQPConsumer<DomainEvent>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly configService: ConfigService,
    metricsService: MetricsService,
  ) {
    const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    const prefetchCount = parseInt(
      configService.get<string>('RABBITMQ_PREFETCH_COUNT') ?? '10',
      10,
    );

    super({
      serviceName: 'my-service',
      metricsService,
      config: {
        url: rabbitmqUrl,
        exchange: RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
        queue: RABBITMQ_QUEUES.MY_SERVICE,
        routingKeys: ['event.type.*'],
        prefetchCount,
        reconnectInterval: 1000,
        maxReconnectAttempts: 10,
        deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        deadLetterQueue: RABBITMQ_DLQ_NAMES.MY_SERVICE,
      },
      deadLetter: {
        exchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        queue: RABBITMQ_DLQ_NAMES.MY_SERVICE,
        routingKey: RABBITMQ_QUEUES.MY_SERVICE,
        ttl: 604800000, // 7 days
      },
      shouldProcess: (event) => this.isRelevantEvent(event),
      parseMessage: (msg) => JSON.parse(msg.content.toString('utf8')) as DomainEvent,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  protected async processMessage(
    event: DomainEvent,
    context: MessageProcessingContext,
  ): Promise<void> {
    this.logger.log(
      `Processing event '${event.eventType}' (correlationId=${context.correlationId})`,
    );
    // Implement service-specific message processing
  }

  private isRelevantEvent(event: DomainEvent): boolean {
    // Implement event filtering logic
    return true;
  }
}
```

#### Create `src/amqp/amqp-consumer.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MetricsService } from '@superboard/backend-shared/metrics';
import { MyConsumerService } from './my-consumer.service';

@Module({
  providers: [MetricsService, MyConsumerService],
  exports: [MyConsumerService],
})
export class AmqpConsumerModule {}
```

## Migrating an Existing Service

### Step 1: Update Bootstrap

Replace custom NestJS bootstrap code with `NestBootstrap`:

**Before:**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  await app.listen(3000);
}

bootstrap();
```

**After:**

```typescript
import { NestBootstrap } from '@superboard/backend-shared/bootstrap';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type ServiceEnv } from './config/env';

async function bootstrap() {
  const sharedConfig = new SharedConfigService<ServiceEnv>({
    schema: envSchema,
    validateOnLoad: true,
  });

  await NestBootstrap.bootstrap(AppModule, {
    service: { name: 'my-service', version: '0.1.0' },
    config: { port: sharedConfig.get('PORT') ?? 3000 },
    middleware: { correlationId: true },
  });
}

bootstrap();
```

### Step 2: Update Configuration

Replace custom configuration with `SharedConfigService`:

**Before:**

```typescript
// Custom configuration loading
const config = {
  port: process.env.PORT || 3000,
  database: process.env.DATABASE_URL,
};
```

**After:**

```typescript
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type ServiceEnv } from './config/env';

const sharedConfig = new SharedConfigService<ServiceEnv>({
  schema: envSchema,
  validateOnLoad: true,
});

const port = sharedConfig.get('PORT');
const database = sharedConfig.get('DATABASE_URL');
```

### Step 3: Update Health Checks

Replace custom health check implementation with shared library:

**Before:**

```typescript
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}
```

**After:**

```typescript
import { HealthCheckController, HealthCheckService } from '@superboard/backend-shared/health';

// Use HealthCheckController from shared library
// Configure health indicators in HealthModule
```

### Step 4: Update Metrics

Replace custom metrics with shared library:

**Before:**

```typescript
import { register, Counter } from 'prom-client';

const counter = new Counter({
  name: 'my_metric',
  help: 'My metric',
  registers: [register],
});
```

**After:**

```typescript
import { MetricsService } from '@superboard/backend-shared/metrics';

constructor(private metricsService: MetricsService) {}

// Use metricsService to create and manage metrics
```

### Step 5: Update AMQP Consumers

Replace custom AMQP consumer with `BaseAMQPConsumer`:

**Before:**

```typescript
@Injectable()
export class MyConsumerService implements OnModuleInit {
  private connection: Connection;
  private channel: Channel;

  async onModuleInit() {
    this.connection = await amqplib.connect(this.rabbitmqUrl);
    this.channel = await this.connection.createChannel();
    // Manual setup...
  }
}
```

**After:**

```typescript
@Injectable()
export class MyConsumerService
  extends BaseAMQPConsumer<DomainEvent>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    private readonly configService: ConfigService,
    metricsService: MetricsService,
  ) {
    super({
      serviceName: 'my-service',
      metricsService,
      config: {
        /* ... */
      },
      deadLetter: {
        /* ... */
      },
      shouldProcess: (event) => true,
      parseMessage: (msg) => JSON.parse(msg.content.toString()),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  protected async processMessage(event: DomainEvent): Promise<void> {
    // Implement message processing
  }
}
```

## Common Patterns

### Pattern 1: Service-Specific Configuration

```typescript
// src/config/env.ts
const envSchema = z.object({
  // Common variables
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Service-specific variables
  MY_SERVICE_SPECIFIC_VAR: z.string().min(1),
});

export type MyServiceEnv = z.infer<typeof envSchema>;
```

### Pattern 2: Custom Health Indicators

```typescript
import { HealthIndicator } from '@superboard/backend-shared/health';

class MyCustomHealthIndicator extends HealthIndicator {
  async check(): Promise<HealthStatus> {
    try {
      // Check custom dependency
      return { status: 'healthy', latencyMs: 10 };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Register in health module
health.registerIndicator(new MyCustomHealthIndicator('my-dependency'));
```

### Pattern 3: Custom Metrics

```typescript
import { MetricsService } from '@superboard/backend-shared/metrics';

constructor(private metricsService: MetricsService) {
  // Create custom counter
  this.myCounter = this.metricsService.createCounter(
    'my_custom_metric',
    'My custom metric',
    ['label1', 'label2'],
  );
}

// Use the counter
this.myCounter.inc({ label1: 'value1', label2: 'value2' });
```

### Pattern 4: Event Processing with Correlation IDs

```typescript
protected async processMessage(
  event: DomainEvent,
  context: MessageProcessingContext,
): Promise<void> {
  // Correlation ID is automatically tracked
  this.logger.log(`Processing event`, {
    correlationId: context.correlationId,
    eventType: event.eventType,
  });

  // Process event
  await this.handleEvent(event);
}
```

## Troubleshooting

### Issue: Configuration validation fails

**Solution**: Ensure your environment schema matches the actual environment variables:

```typescript
// Check that all required variables are set
const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error('Configuration errors:', result.error.flatten());
}
```

### Issue: Health check endpoint returns 503

**Solution**: Check that all registered health indicators are healthy:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

### Issue: AMQP consumer not connecting

**Solution**: Verify RabbitMQ connection string and credentials:

```typescript
const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');
console.log('Connecting to:', rabbitmqUrl);
```

### Issue: Metrics not being collected

**Solution**: Ensure MetricsService is properly injected and used:

```typescript
constructor(private metricsService: MetricsService) {
  // Verify metricsService is not undefined
  console.log('MetricsService:', this.metricsService);
}
```

### Issue: Graceful shutdown not working

**Solution**: Ensure `onModuleDestroy` is implemented:

```typescript
async onModuleDestroy(): Promise<void> {
  // Clean up resources
  await this.amqpConsumer?.stop();
  await this.redisPool?.closeAll();
}
```

## Best Practices

1. **Always validate configuration on startup** - Use Zod schemas with `validateOnLoad: true`
2. **Register all critical dependencies as health indicators** - This helps with monitoring
3. **Use correlation IDs for tracing** - Enable in NestBootstrap middleware
4. **Implement graceful shutdown** - Properly close connections in `onModuleDestroy`
5. **Use consistent naming conventions** - Follow the patterns established in existing services
6. **Document service-specific configuration** - Create `.env.example` files
7. **Test health endpoints regularly** - Include in integration tests
8. **Monitor metrics in production** - Set up Prometheus scraping

## Additional Resources

- [Backend Shared Library README](./README.md)
- [Configuration Management Guide](./src/config/README.md)
- [Health Check System Documentation](./src/health/README.md)
- [Metrics Collection Guide](./src/metrics/README.md)
- [AMQP Consumer Framework Documentation](./src/amqp/README.md)
