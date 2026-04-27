import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .union([z.number().int().positive(), z.string()])
    .optional()
    .transform((v) => (v === undefined ? undefined : typeof v === 'number' ? v : Number(v)))
    .refine((v) => v === undefined || (Number.isFinite(v) && v > 0), 'Invalid PORT')
    .default(3004),
  RABBITMQ_URL: z.string().min(1),
  RABBITMQ_PREFETCH_COUNT: z
    .union([z.number().int().positive(), z.string()])
    .optional()
    .transform((v) => (v === undefined ? 10 : typeof v === 'number' ? v : Number(v)))
    .refine((v) => Number.isFinite(v) && v > 0, 'Invalid RABBITMQ_PREFETCH_COUNT')
    .default(10),
});

export type AutomationEnv = z.infer<typeof envSchema>;
export { envSchema };

export function validateEnv(config: Record<string, unknown>): AutomationEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }
  return result.data;
}
