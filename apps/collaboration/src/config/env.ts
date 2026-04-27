import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().optional().default('http://localhost:3000'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  CORE_API_URL: z.string().min(1).default('http://localhost:4000'),
});

export type CollaborationEnv = z.infer<typeof envSchema>;
export { envSchema };

export function validateEnv(config: Record<string, unknown>): CollaborationEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }
  return result.data;
}
