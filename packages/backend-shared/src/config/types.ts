/**
 * Configuration type definitions
 */

import { z } from 'zod';

// Re-export common types from main types module
export type {
  AMQPConfig,
  RedisConfig,
  DatabaseConfig,
  HealthConfig,
  DependencyConfig,
  MetricsConfig,
  BootstrapConfig,
} from '../types';

import type {
  AMQPConfig,
  RedisConfig,
  DatabaseConfig,
  HealthConfig,
  MetricsConfig,
  BootstrapConfig,
} from '../types';

export interface ConfigOptions<T> {
  /**
   * Accept schemas that coerce/transform input (e.g. string -> number).
   * ZodSchema<T> is too strict because it requires input and output types to match.
   */
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  envOverrides?: Partial<T>;
  envPrefix?: string;
  validateOnLoad?: boolean;
}

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT?: number;
  LOG_LEVEL?: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * API Service Configuration Interface
 */
export interface APIServiceConfig extends EnvironmentConfig {
  database: DatabaseConfig;
  redis: RedisConfig;
  amqp: AMQPConfig;
  health: HealthConfig;
  metrics: MetricsConfig;
  bootstrap: BootstrapConfig;
  jwt?: {
    secret: string;
    expiresIn: string;
  };
  upload?: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    destination: string;
  };
}

/**
 * AI Service Configuration Interface
 */
export interface AIServiceConfig extends EnvironmentConfig {
  amqp: AMQPConfig;
  redis: RedisConfig;
  health: HealthConfig;
  metrics: MetricsConfig;
  ai: {
    provider: 'openai' | 'gemini' | 'anthropic';
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
  };
  grpc?: {
    port: number;
    host: string;
  };
}

/**
 * Automation Service Configuration Interface
 */
export interface AutomationServiceConfig extends EnvironmentConfig {
  database: DatabaseConfig;
  redis: RedisConfig;
  amqp: AMQPConfig;
  health: HealthConfig;
  metrics: MetricsConfig;
  bootstrap: BootstrapConfig;
  scheduler?: {
    enabled: boolean;
    timezone: string;
    maxConcurrentJobs: number;
  };
}

/**
 * Collaboration Service Configuration Interface
 */
export interface CollaborationServiceConfig extends EnvironmentConfig {
  database: DatabaseConfig;
  redis: RedisConfig;
  amqp: AMQPConfig;
  health: HealthConfig;
  metrics: MetricsConfig;
  bootstrap: BootstrapConfig;
  websocket?: {
    port: number;
    cors: {
      origin: string | string[];
    };
  };
}

/**
 * Notification Service Configuration Interface
 */
export interface NotificationServiceConfig extends EnvironmentConfig {
  database: DatabaseConfig;
  redis: RedisConfig;
  amqp: AMQPConfig;
  health: HealthConfig;
  metrics: MetricsConfig;
  bootstrap: BootstrapConfig;
  email?: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    config: unknown;
  };
  push?: {
    provider: 'fcm' | 'apns';
    config: unknown;
  };
}

/**
 * Search Service Configuration Interface
 */
export interface SearchServiceConfig extends EnvironmentConfig {
  database: DatabaseConfig;
  redis: RedisConfig;
  amqp: AMQPConfig;
  health: HealthConfig;
  metrics: MetricsConfig;
  bootstrap: BootstrapConfig;
  elasticsearch?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
    ssl?: boolean;
  };
}
