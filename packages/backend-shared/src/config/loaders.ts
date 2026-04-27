/**
 * Environment-specific configuration file loaders
 *
 * Provides configuration loading from JSON and YAML files with environment-specific
 * file discovery, default value handling, and comprehensive error handling.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

/**
 * Configuration file formats supported by the loaders
 */
export type ConfigFileFormat = 'json' | 'yaml' | 'yml';

/**
 * Environment types for configuration loading
 */
export type Environment = 'development' | 'production' | 'test' | 'staging';

/**
 * Configuration loader options
 */
export interface ConfigLoaderOptions {
  /** Base directory to search for configuration files */
  configDir?: string;
  /** Environment to load configuration for */
  environment?: Environment;
  /** Whether to merge with default configuration */
  mergeDefaults?: boolean;
  /** Whether to validate configuration after loading */
  validate?: boolean;
  /** Custom file name patterns to search for */
  filePatterns?: string[];
}

/**
 * Configuration file metadata
 */
export interface ConfigFileInfo {
  path: string;
  format: ConfigFileFormat;
  environment?: Environment;
  exists: boolean;
}

/**
 * Configuration loading result
 */
export interface ConfigLoadResult<T = unknown> {
  config: T;
  sources: ConfigFileInfo[];
  errors: ConfigLoadError[];
}

/**
 * Configuration loading error
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

/**
 * Configuration file loader class
 */
export class ConfigFileLoader {
  private readonly configDir: string;
  private readonly environment: Environment;
  private readonly mergeDefaults: boolean;
  private readonly validate: boolean;
  private readonly filePatterns: string[];

  constructor(options: ConfigLoaderOptions = {}) {
    this.configDir = options.configDir || process.cwd();
    this.environment = options.environment || this.detectEnvironment();
    this.mergeDefaults = options.mergeDefaults ?? true;
    this.validate = options.validate ?? true;
    this.filePatterns = options.filePatterns || this.getDefaultFilePatterns();
  }

  /**
   * Load configuration from files with environment-specific overrides
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadConfig<T = any>(schema?: z.ZodSchema<T>): Promise<ConfigLoadResult<T>> {
    const sources: ConfigFileInfo[] = [];
    const errors: ConfigLoadError[] = [];
    let config: Record<string, unknown> = {};

    // Discover configuration files
    const configFiles = await this.discoverConfigFiles();

    // Load base configuration first
    const baseFiles = configFiles.filter((f) => !f.environment);
    for (const file of baseFiles) {
      try {
        const fileConfig = await this.loadConfigFile(file.path, file.format);
        config = this.mergeConfigurations(config, fileConfig);
        sources.push({ ...file, exists: true });
      } catch (error) {
        const loadError = new ConfigLoadError(
          `Failed to load base config file: ${file.path}`,
          file.path,
          error as Error,
        );
        errors.push(loadError);
        sources.push({ ...file, exists: false });
      }
    }

    // Load environment-specific configuration
    const envFiles = configFiles.filter((f) => f.environment === this.environment);
    for (const file of envFiles) {
      try {
        const fileConfig = await this.loadConfigFile(file.path, file.format);
        config = this.mergeConfigurations(config, fileConfig);
        sources.push({ ...file, exists: true });
      } catch (error) {
        const loadError = new ConfigLoadError(
          `Failed to load environment config file: ${file.path}`,
          file.path,
          error as Error,
        );
        errors.push(loadError);
        sources.push({ ...file, exists: false });
      }
    }

    // Apply default values if merging is enabled
    if (this.mergeDefaults) {
      config = this.applyDefaultValues(config);
    }

    // Validate configuration if schema is provided and validation is enabled
    if (schema && this.validate) {
      const result = schema.safeParse(config);
      if (!result.success) {
        const validationError = new ConfigLoadError(
          `Configuration validation failed: ${result.error.message}`,
          'validation',
        );
        errors.push(validationError);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config = result.data as Record<string, any>;
      }
    }

    return {
      config: config as unknown as T,
      sources,
      errors,
    };
  }

  /**
   * Load configuration from a specific file
   */
  async loadConfigFile(
    filePath: string,
    format: ConfigFileFormat,
  ): Promise<Record<string, unknown>> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return this.parseConfigContent(content, format, filePath);
    } catch (error) {
      throw new ConfigLoadError(
        `Failed to read config file: ${filePath}`,
        filePath,
        error as Error,
      );
    }
  }

  /**
   * Discover configuration files in the config directory
   */
  async discoverConfigFiles(): Promise<ConfigFileInfo[]> {
    const configFiles: ConfigFileInfo[] = [];

    for (const pattern of this.filePatterns) {
      const files = await this.findConfigFiles(pattern);
      configFiles.push(...files);
    }

    // Remove duplicates and sort by priority (base files first, then environment-specific)
    const uniqueFiles = this.deduplicateConfigFiles(configFiles);
    return this.sortConfigFilesByPriority(uniqueFiles);
  }

  /**
   * Find configuration files matching a pattern
   */
  private async findConfigFiles(pattern: string): Promise<ConfigFileInfo[]> {
    const files: ConfigFileInfo[] = [];
    const formats: ConfigFileFormat[] = ['json', 'yaml', 'yml'];

    for (const format of formats) {
      // Base configuration file
      const baseFile = path.join(this.configDir, `${pattern}.${format}`);
      if (await this.fileExists(baseFile)) {
        files.push({
          path: baseFile,
          format,
          exists: true,
        });
      }

      // Environment-specific configuration file
      const envFile = path.join(this.configDir, `${pattern}.${this.environment}.${format}`);
      if (await this.fileExists(envFile)) {
        files.push({
          path: envFile,
          format,
          environment: this.environment,
          exists: true,
        });
      }
    }

    return files;
  }

  /**
   * Parse configuration file content based on format
   */
  private parseConfigContent(
    content: string,
    format: ConfigFileFormat,
    filePath: string,
  ): Record<string, unknown> {
    try {
      switch (format) {
        case 'json':
          return JSON.parse(content);
        case 'yaml':
        case 'yml':
          return yaml.load(content) as Record<string, unknown>;
        default:
          throw new Error(`Unsupported configuration format: ${format}`);
      }
    } catch (error) {
      throw new ConfigLoadError(
        `Failed to parse ${format.toUpperCase()} content`,
        filePath,
        error as Error,
      );
    }
  }

  /**
   * Merge two configuration objects with deep merging
   */
  private mergeConfigurations(
    base: Record<string, unknown>,
    override: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!override || typeof override !== 'object') {
      return base;
    }

    if (!base || typeof base !== 'object') {
      return override;
    }

    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.mergeConfigurations(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Apply default values to configuration
   */
  private applyDefaultValues(config: Record<string, unknown>): Record<string, unknown> {
    const defaults = {
      NODE_ENV: this.environment,
      PORT: 3000,
      LOG_LEVEL: 'info',
      // AMQP defaults
      amqp: {
        prefetchCount: 10,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10,
      },
      // Redis defaults
      redis: {
        port: 6379,
        host: 'localhost',
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      },
      // Database defaults
      database: {
        port: 5432,
        host: 'localhost',
        ssl: false,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 10,
      },
      // Health check defaults
      health: {
        endpoints: {
          health: '/health',
          ready: '/ready',
        },
      },
      // Metrics defaults
      metrics: {
        enabled: true,
        endpoint: '/metrics',
        collectDefaultMetrics: true,
      },
      // Bootstrap defaults
      bootstrap: {
        globalPrefix: 'api/v1',
        cors: {
          origin: true,
          credentials: true,
        },
      },
    };

    return this.mergeConfigurations(defaults, config);
  }

  /**
   * Detect current environment from NODE_ENV or default to development
   */
  private detectEnvironment(): Environment {
    const env = process.env.NODE_ENV as Environment;
    const validEnvironments: Environment[] = ['development', 'production', 'test', 'staging'];

    if (validEnvironments.includes(env)) {
      return env;
    }

    return 'development';
  }

  /**
   * Get default file patterns to search for
   */
  private getDefaultFilePatterns(): string[] {
    return ['config', 'app', 'application', 'settings'];
  }

  /**
   * Check if a file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove duplicate configuration files (prefer more specific formats)
   */
  private deduplicateConfigFiles(files: ConfigFileInfo[]): ConfigFileInfo[] {
    const fileMap = new Map<string, ConfigFileInfo>();

    for (const file of files) {
      const key = `${path.basename(file.path, path.extname(file.path))}_${file.environment || 'base'}`;
      const existing = fileMap.get(key);

      if (
        !existing ||
        this.getFormatPriority(file.format) > this.getFormatPriority(existing.format)
      ) {
        fileMap.set(key, file);
      }
    }

    return Array.from(fileMap.values());
  }

  /**
   * Sort configuration files by loading priority
   */
  private sortConfigFilesByPriority(files: ConfigFileInfo[]): ConfigFileInfo[] {
    return files.sort((a, b) => {
      // Base files first, then environment-specific
      if (!a.environment && b.environment) return -1;
      if (a.environment && !b.environment) return 1;

      // Within same category, sort by format priority
      return this.getFormatPriority(b.format) - this.getFormatPriority(a.format);
    });
  }

  /**
   * Get format priority (higher number = higher priority)
   */
  private getFormatPriority(format: ConfigFileFormat): number {
    switch (format) {
      case 'yaml':
        return 3;
      case 'yml':
        return 2;
      case 'json':
        return 1;
      default:
        return 0;
    }
  }
}

/**
 * Convenience function to load configuration with default options
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadConfig<T = any>(
  schema?: z.ZodSchema<T>,
  options?: ConfigLoaderOptions,
): Promise<ConfigLoadResult<T>> {
  const loader = new ConfigFileLoader(options);
  return loader.loadConfig(schema);
}

/**
 * Load configuration for a specific environment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadEnvironmentConfig<T = any>(
  environment: Environment,
  schema?: z.ZodSchema<T>,
  configDir?: string,
): Promise<ConfigLoadResult<T>> {
  return loadConfig(schema, {
    environment,
    configDir,
    mergeDefaults: true,
    validate: true,
  });
}

/**
 * Load configuration from a specific file
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadConfigFromFile<T = any>(
  filePath: string,
  schema?: z.ZodSchema<T>,
): Promise<T> {
  const loader = new ConfigFileLoader();
  const format = path.extname(filePath).slice(1) as ConfigFileFormat;

  if (!['json', 'yaml', 'yml'].includes(format)) {
    throw new ConfigLoadError(`Unsupported file format: ${format}`, filePath);
  }

  const config = await loader.loadConfigFile(filePath, format);

  if (schema) {
    const result = schema.safeParse(config);
    if (!result.success) {
      throw new ConfigLoadError(
        `Configuration validation failed: ${result.error.message}`,
        filePath,
      );
    }
    return result.data;
  }

  return config as unknown as T;
}
