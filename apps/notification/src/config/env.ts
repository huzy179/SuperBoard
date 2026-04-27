import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3002),
  RABBITMQ_URL: z.string().min(1).default('amqp://localhost:5672'),
  RABBITMQ_PREFETCH_COUNT: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  EVENT_CONSUMER_MAX_RETRIES: z.coerce.number().int().positive().default(3),
  NOTIF_RETRY_MAX: z.coerce.number().int().positive().default(5),
  CORE_API_URL: z.string().min(1).default('http://localhost:4000'),
  INTERNAL_API_SECRET: z.string().optional().default(''),
});

export type NotificationEnv = z.infer<typeof envSchema>;
export { envSchema };

export function validateEnv(config: Record<string, unknown>): NotificationEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }
  return result.data;
}
