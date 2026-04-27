/**
 * Configuration Validators using Zod schemas
 *
 * Provides validation schemas for all configuration types used across services.
 */

import { z } from 'zod';
import {} from './types';

/**
 * Environment Configuration Schema
 */
export const EnvironmentConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development') as z.ZodType<
    'development' | 'production' | 'test'
  >,
  PORT: z.number().int().positive().optional().default(3000),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any; // Cast to any to allow .extend() and avoid IDE satisfies issues

/**
 * AMQP Configuration Schema
 */
export const AMQPConfigSchema = z.object({
  url: z.string().url('Invalid AMQP URL'),
  exchange: z.string().min(1, 'Exchange name is required'),
  queue: z.string().min(1, 'Queue name is required'),
  routingKeys: z.array(z.string()).min(1, 'At least one routing key is required'),
  prefetchCount: z.number().int().positive().optional().default(10),
  reconnectInterval: z.number().int().positive().optional().default(5000),
  maxReconnectAttempts: z.number().int().positive().optional().default(10),
  deadLetterExchange: z.string().optional(),
  deadLetterQueue: z.string().optional(),
});

/**
 * Redis Configuration Schema
 */
export const RedisConfigSchema = z.object({
  host: z.string().min(1, 'Redis host is required'),
  port: z.number().int().min(1).max(65535, 'Invalid Redis port'),
  password: z.string().optional(),
  db: z.number().int().min(0).max(15).optional().default(0),
  maxRetriesPerRequest: z.number().int().positive().optional().default(3),
  retryDelayOnFailover: z.number().int().positive().optional().default(100),
  lazyConnect: z.boolean().optional().default(true),
});

/**
 * Database Configuration Schema
 */
export const DatabaseConfigSchema = z.object({
  host: z.string().min(1, 'Database host is required'),
  port: z.number().int().min(1).max(65535, 'Invalid database port'),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Database username is required'),
  password: z.string().min(1, 'Database password is required'),
  ssl: z.boolean().optional().default(false),
  connectionTimeoutMillis: z.number().int().positive().optional().default(60000),
  idleTimeoutMillis: z.number().int().positive().optional().default(60000),
  max: z.number().int().positive().optional().default(10),
});

/**
 * Dependency Configuration Schema
 */
export const DependencyConfigSchema = z.object({
  name: z.string().min(1, 'Dependency name is required'),
  type: z.enum(['database', 'redis', 'rabbitmq', 'grpc', 'http']),
  config: z.any(),
  timeout: z.number().int().positive().optional().default(5000),
});

/**
 * Health Configuration Schema
 */
export const HealthConfigSchema = z.object({
  endpoints: z.object({
    health: z.string().min(1, 'Health endpoint path is required').default('/health'),
    ready: z.string().min(1, 'Ready endpoint path is required').default('/ready'),
  }),
  dependencies: z.array(DependencyConfigSchema).default([]),
});

/**
 * Metrics Configuration Schema
 */
export const MetricsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  prefix: z.string().optional(),
  defaultLabels: z.record(z.string(), z.string()).optional(),
  collectDefaultMetrics: z.boolean().optional().default(true),
});

/**
 * Bootstrap Configuration Schema
 */
export const BootstrapConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).optional().default(3000),
  globalPrefix: z.string().optional().default('api/v1'),
  cors: z
    .object({
      origin: z
        .union([z.string(), z.array(z.string()), z.boolean()])
        .optional()
        .default(true),
      credentials: z.boolean().optional().default(true),
    })
    .optional(),
  logger: z.any().optional(),
  gracefulShutdownTimeout: z.number().int().positive().optional().default(30000),
});

/**
 * API Service Configuration Schema
 */
export const APIServiceConfigSchema = EnvironmentConfigSchema.extend({
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  amqp: AMQPConfigSchema,
  health: HealthConfigSchema,
  metrics: MetricsConfigSchema,
  bootstrap: BootstrapConfigSchema,
  jwt: z
    .object({
      secret: z.string().min(32, 'JWT secret must be at least 32 characters'),
      expiresIn: z.string().default('24h'),
    })
    .optional(),
  upload: z
    .object({
      maxFileSize: z
        .number()
        .int()
        .positive()
        .default(10 * 1024 * 1024), // 10MB
      allowedMimeTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'application/pdf']),
      destination: z.string().default('./uploads'),
    })
    .optional(),
});

/**
 * AI Service Configuration Schema
 */
export const AIServiceConfigSchema = EnvironmentConfigSchema.extend({
  amqp: AMQPConfigSchema,
  redis: RedisConfigSchema,
  health: HealthConfigSchema,
  metrics: MetricsConfigSchema,
  ai: z.object({
    provider: z.enum(['openai', 'gemini', 'anthropic']),
    apiKey: z.string().min(1, 'AI API key is required'),
    model: z.string().min(1, 'AI model is required'),
    maxTokens: z.number().int().positive().optional().default(4096),
    temperature: z.number().min(0).max(2).optional().default(0.7),
  }),
  grpc: z
    .object({
      port: z.number().int().min(1).max(65535).default(50051),
      host: z.string().default('0.0.0.0'),
    })
    .optional(),
});

/**
 * Automation Service Configuration Schema
 */
export const AutomationServiceConfigSchema = EnvironmentConfigSchema.extend({
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  amqp: AMQPConfigSchema,
  health: HealthConfigSchema,
  metrics: MetricsConfigSchema,
  bootstrap: BootstrapConfigSchema,
  scheduler: z
    .object({
      enabled: z.boolean().default(true),
      timezone: z.string().default('UTC'),
      maxConcurrentJobs: z.number().int().positive().default(10),
    })
    .optional(),
});

/**
 * Collaboration Service Configuration Schema
 */
export const CollaborationServiceConfigSchema = EnvironmentConfigSchema.extend({
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  amqp: AMQPConfigSchema,
  health: HealthConfigSchema,
  metrics: MetricsConfigSchema,
  bootstrap: BootstrapConfigSchema,
  websocket: z
    .object({
      port: z.number().int().min(1).max(65535).default(3001),
      cors: z.object({
        origin: z.union([z.string(), z.array(z.string())]).default('*'),
      }),
    })
    .optional(),
});

/**
 * Notification Service Configuration Schema
 */
export const NotificationServiceConfigSchema = EnvironmentConfigSchema.extend({
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  amqp: AMQPConfigSchema,
  health: HealthConfigSchema,
  metrics: MetricsConfigSchema,
  bootstrap: BootstrapConfigSchema,
  email: z
    .object({
      provider: z.enum(['smtp', 'sendgrid', 'ses']),
      config: z.any(),
    })
    .optional(),
  push: z
    .object({
      provider: z.enum(['fcm', 'apns']),
      config: z.any(),
    })
    .optional(),
});

/**
 * Search Service Configuration Schema
 */
export const SearchServiceConfigSchema = EnvironmentConfigSchema.extend({
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  amqp: AMQPConfigSchema,
  health: HealthConfigSchema,
  metrics: MetricsConfigSchema,
  bootstrap: BootstrapConfigSchema,
  elasticsearch: z
    .object({
      host: z.string().min(1, 'Elasticsearch host is required'),
      port: z.number().int().min(1).max(65535).default(9200),
      username: z.string().optional(),
      password: z.string().optional(),
      ssl: z.boolean().optional().default(false),
    })
    .optional(),
});

/**
 * Validate configuration against a schema
 */
export function validateConfig<T>(
  config: unknown,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(config);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error.issues };
}

/**
 * Create a configuration validator function for a specific schema
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (config: unknown) => validateConfig(config, schema);
}
