/**
 * Common type definitions for backend shared library
 */

// AMQP Types
export interface AMQPConfig {
  url: string;
  exchange: string;
  queue: string;
  routingKeys: string[];
  prefetchCount?: number | undefined;
  reconnectInterval?: number | undefined;
  maxReconnectAttempts?: number | undefined;
  deadLetterExchange?: string | undefined;
  deadLetterQueue?: string | undefined;
}

export interface AMQPMessage {
  content: Buffer;
  fields: {
    deliveryTag: number;
    redelivered: boolean;
    exchange: string;
    routingKey: string;
  };
  properties: {
    correlationId?: string;
    messageId?: string;
    timestamp?: number;
    headers?: Record<string, unknown>;
  };
}

// Health Check Types
export interface HealthConfig {
  endpoints: {
    health: string;
    ready: string;
  };
  dependencies: DependencyConfig[];
}

export interface DependencyConfig {
  name: string;
  type: 'database' | 'redis' | 'rabbitmq' | 'grpc' | 'http';
  config: unknown;
  timeout?: number;
}

export interface HealthResult {
  status: 'ok' | 'error';
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
}

export interface ReadinessResult extends HealthResult {
  dependencies: DependencyHealth[];
}

export interface DependencyHealth {
  name: string;
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  error?: string;
}

// Event Types
export interface DomainEvent {
  eventType: string;
  correlationId: string;
  timestamp: string;
  payload: unknown;
  metadata?: Record<string, unknown> | undefined;
}

export interface EventContext {
  correlationId: string;
  timestamp: Date;
  retryCount: number;
  metadata: Record<string, unknown>;
}

// Configuration Types
export interface ConfigValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Connection Types
export interface RedisConfig {
  host: string;
  port: number;
  password?: string | undefined;
  db?: number | undefined;
  maxRetriesPerRequest?: number | undefined;
  retryDelayOnFailover?: number | undefined;
  lazyConnect?: boolean | undefined;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean | undefined;
  connectionTimeoutMillis?: number | undefined;
  idleTimeoutMillis?: number | undefined;
  max?: number | undefined; // pool size
}

// Metrics Types
export interface MetricsConfig {
  enabled: boolean;
  prefix?: string;
  defaultLabels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
}

// Bootstrap Types
export interface BootstrapConfig {
  port?: number;
  globalPrefix?: string;
  cors?: {
    origin: string | string[] | boolean;
    credentials?: boolean;
  };
  logger?: unknown;
  gracefulShutdownTimeout?: number;
}

// Error Types
export enum ErrorType {
  BUSINESS = 'business',
  TECHNICAL = 'technical',
  VALIDATION = 'validation',
  INFRASTRUCTURE = 'infrastructure',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    type: ErrorType;
    severity: ErrorSeverity;
    correlationId: string;
    timestamp: string;
    details?: unknown;
    stack?: string; // Only in development
  };
}

// Retry Types
export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}
