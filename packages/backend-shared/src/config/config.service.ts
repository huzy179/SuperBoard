/**
 * Configuration Service with Zod validation and generic type support
 *
 * Provides type-safe configuration loading with environment variable support,
 * validation, and error handling for configuration validation failures.
 */

import { z } from 'zod';
import type {
  ConfigOptions,
  EnvironmentConfig,
  APIServiceConfig,
  AIServiceConfig,
  AutomationServiceConfig,
  CollaborationServiceConfig,
  NotificationServiceConfig,
  SearchServiceConfig,
  AMQPConfig,
  RedisConfig,
  DatabaseConfig,
  HealthConfig,
  MetricsConfig,
  BootstrapConfig,
} from './types';
import {
  EnvironmentConfigSchema,
  AMQPConfigSchema,
  RedisConfigSchema,
  DatabaseConfigSchema,
  HealthConfigSchema,
  MetricsConfigSchema,
  BootstrapConfigSchema,
  APIServiceConfigSchema,
  AIServiceConfigSchema,
  AutomationServiceConfigSchema,
  CollaborationServiceConfigSchema,
  NotificationServiceConfigSchema,
  SearchServiceConfigSchema,
} from './validators';
import { ConfigFileLoader, ConfigLoaderOptions } from './loaders';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ConfigService<T = any> {
  private config: T;
  private schema: z.ZodSchema<T>;

  constructor(options: ConfigOptions<T>) {
    this.schema = options.schema;
    this.config = this.loadAndValidate(options);
  }

  /**
   * Get a configuration value by key
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.config[key];
  }

  /**
   * Get a required configuration value (throws if null/undefined)
   */
  getRequired<K extends keyof T>(key: K): NonNullable<T[K]> {
    const value = this.config[key];
    if (value === null || value === undefined) {
      throw new Error(`Required configuration key '${String(key)}' is missing or null`);
    }
    return value as NonNullable<T[K]>;
  }

  /**
   * Get the entire configuration object
   */
  getAll(): T {
    return { ...this.config };
  }

  /**
   * Check if a configuration key exists and has a value
   */
  has<K extends keyof T>(key: K): boolean {
    const value = this.config[key];
    return value !== null && value !== undefined;
  }

  /**
   * Validate a partial configuration object against the schema
   */
  validate(partialConfig: Partial<T>) {
    return this.schema.safeParse(partialConfig);
  }

  /**
   * Load configuration from files with environment-specific overrides
   * This method integrates with ConfigFileLoader to support file-based configuration
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async loadFromFiles<T = any>(
    schema: z.ZodSchema<T>,
    options?: ConfigLoaderOptions,
  ): Promise<ConfigService<T>> {
    const loader = new ConfigFileLoader(options);
    const result = await loader.loadConfig(schema);

    if (result.errors.length > 0) {
      const errorMessages = result.errors.map((err) => err.message).join('; ');
      throw new Error(`Configuration loading failed: ${errorMessages}`);
    }

    return new ConfigService({
      schema,
      envOverrides: result.config,
      validateOnLoad: true,
    });
  }

  /**
   * Load and validate configuration from environment variables and overrides
   */
  private loadAndValidate(options: ConfigOptions<T>): T {
    const { schema, envOverrides = {}, envPrefix = '', validateOnLoad = true } = options;

    // Load environment variables with optional prefix
    const envConfig = this.loadEnvironmentVariables(envPrefix);

    // Merge environment config with overrides (overrides take precedence)
    const mergedConfig = {
      ...envConfig,
      ...envOverrides,
    };

    if (!validateOnLoad) {
      return mergedConfig as T;
    }

    // Validate the merged configuration
    const result = schema.safeParse(mergedConfig);

    if (!result.success) {
      const errorMessages = result.error.issues
        .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');

      throw new ConfigurationValidationError(
        `Configuration validation failed: ${errorMessages}`,
        result.error.issues,
      );
    }

    return result.data;
  }

  /**
   * Load environment variables and convert them to appropriate types
   */
  private loadEnvironmentVariables(prefix: string): Record<string, unknown> {
    const envConfig: Record<string, unknown> = {};

    // Get all environment variables
    const env = process.env;

    // Process each environment variable
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) continue;

      // Apply prefix filter if specified
      const configKey = prefix ? (key.startsWith(prefix) ? key.slice(prefix.length) : null) : key;

      if (configKey === null) continue;

      // Convert environment variable to appropriate type
      envConfig[configKey] = this.parseEnvironmentValue(value);
    }

    return envConfig;
  }

  /**
   * Parse environment variable value to appropriate JavaScript type
   */
  private parseEnvironmentValue(value: string): unknown {
    // Handle boolean values
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Handle null/undefined
    if (value.toLowerCase() === 'null') return null;
    if (value.toLowerCase() === 'undefined') return undefined;

    // Handle numbers
    if (/^\d+$/.test(value)) {
      const num = parseInt(value, 10);
      return isNaN(num) ? value : num;
    }

    if (/^\d*\.\d+$/.test(value)) {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }

    // Handle JSON objects/arrays
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        return JSON.parse(value);
      } catch {
        // If JSON parsing fails, return as string
        return value;
      }
    }

    // Return as string by default
    return value;
  }
}

/**
 * Custom error class for configuration validation failures
 */
export class ConfigurationValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'ConfigurationValidationError';
  }
}

/**
 * Create a typed configuration service for common environment configuration
 */
export function createEnvironmentConfigService(
  overrides?: Partial<EnvironmentConfig>,
): ConfigService<EnvironmentConfig> {
  return new ConfigService<EnvironmentConfig>({
    schema: EnvironmentConfigSchema,
    envOverrides: overrides,
    validateOnLoad: true,
  });
}

/**
 * Configuration Service Factory Functions for Different Service Types
 */

export class ConfigServiceFactory {
  /**
   * Create API Service configuration
   */
  static createAPIServiceConfig(overrides?: Partial<APIServiceConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: APIServiceConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create AI Service configuration
   */
  static createAIServiceConfig(overrides?: Partial<AIServiceConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: AIServiceConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Automation Service configuration
   */
  static createAutomationServiceConfig(
    overrides?: Partial<AutomationServiceConfig>,
    envPrefix?: string,
  ) {
    return new ConfigService({
      schema: AutomationServiceConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Collaboration Service configuration
   */
  static createCollaborationServiceConfig(
    overrides?: Partial<CollaborationServiceConfig>,
    envPrefix?: string,
  ) {
    return new ConfigService({
      schema: CollaborationServiceConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Notification Service configuration
   */
  static createNotificationServiceConfig(
    overrides?: Partial<NotificationServiceConfig>,
    envPrefix?: string,
  ) {
    return new ConfigService({
      schema: NotificationServiceConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Search Service configuration
   */
  static createSearchServiceConfig(overrides?: Partial<SearchServiceConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: SearchServiceConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create AMQP configuration service
   */
  static createAMQPConfig(overrides?: Partial<AMQPConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: AMQPConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Redis configuration service
   */
  static createRedisConfig(overrides?: Partial<RedisConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: RedisConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Database configuration service
   */
  static createDatabaseConfig(overrides?: Partial<DatabaseConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: DatabaseConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Health configuration service
   */
  static createHealthConfig(overrides?: Partial<HealthConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: HealthConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Metrics configuration service
   */
  static createMetricsConfig(overrides?: Partial<MetricsConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: MetricsConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Create Bootstrap configuration service
   */
  static createBootstrapConfig(overrides?: Partial<BootstrapConfig>, envPrefix?: string) {
    return new ConfigService({
      schema: BootstrapConfigSchema,
      envOverrides: overrides,
      envPrefix,
      validateOnLoad: true,
    });
  }

  /**
   * Load API Service configuration from files
   */
  static async loadAPIServiceConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(APIServiceConfigSchema, options);
  }

  /**
   * Load AI Service configuration from files
   */
  static async loadAIServiceConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(AIServiceConfigSchema, options);
  }

  /**
   * Load Automation Service configuration from files
   */
  static async loadAutomationServiceConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(AutomationServiceConfigSchema, options);
  }

  /**
   * Load Collaboration Service configuration from files
   */
  static async loadCollaborationServiceConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(CollaborationServiceConfigSchema, options);
  }

  /**
   * Load Notification Service configuration from files
   */
  static async loadNotificationServiceConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(NotificationServiceConfigSchema, options);
  }

  /**
   * Load Search Service configuration from files
   */
  static async loadSearchServiceConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(SearchServiceConfigSchema, options);
  }

  /**
   * Load AMQP configuration from files
   */
  static async loadAMQPConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(AMQPConfigSchema, options);
  }

  /**
   * Load Redis configuration from files
   */
  static async loadRedisConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(RedisConfigSchema, options);
  }

  /**
   * Load Database configuration from files
   */
  static async loadDatabaseConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(DatabaseConfigSchema, options);
  }

  /**
   * Load Health configuration from files
   */
  static async loadHealthConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(HealthConfigSchema, options);
  }

  /**
   * Load Metrics configuration from files
   */
  static async loadMetricsConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(MetricsConfigSchema, options);
  }

  /**
   * Load Bootstrap configuration from files
   */
  static async loadBootstrapConfigFromFiles(options?: ConfigLoaderOptions) {
    return ConfigService.loadFromFiles(BootstrapConfigSchema, options);
  }
}
