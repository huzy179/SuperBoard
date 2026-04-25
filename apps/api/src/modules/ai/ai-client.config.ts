import { status as GrpcStatus } from '@grpc/grpc-js';

export const AI_CLIENT_CONFIG = {
  timeout: parseInt(process.env.AI_GRPC_TIMEOUT_MS ?? '10000', 10),
  retry: {
    maxAttempts: parseInt(process.env.AI_RETRY_MAX ?? '3', 10),
    initialDelayMs: 500,
    backoffMultiplier: 2,
    retryableErrors: [GrpcStatus.UNAVAILABLE, GrpcStatus.DEADLINE_EXCEEDED],
  },
  circuitBreaker: {
    failureThreshold: parseInt(process.env.AI_CB_THRESHOLD ?? '5', 10),
    successThreshold: 2,
    timeout: 30000,
  },
  fallbacks: {
    summarize: { summary: null, fallback: true },
    briefing: { briefing: null, fallback: true },
    suggestLabels: { labels: [] as string[], fallback: true },
    embeddings: { embedding: [] as number[], fallback: true },
  },
} as const;

export type AiFallbackKey = keyof typeof AI_CLIENT_CONFIG.fallbacks;
