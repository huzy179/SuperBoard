import { z } from 'zod';

const booleanFromEnv = z
  .enum(['true', 'false'])
  .optional()
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  ENABLE_REDIS: booleanFromEnv,
  ENABLE_QUEUE: booleanFromEnv,
  ELASTICSEARCH_URL: z.string().url(),
  QUEUE_NAME: z.string().min(1).default('superboard-dev'),
  FRONTEND_URL: z.string().url(),
  AI_SERVICE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('1d'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }

  return result.data;
}
