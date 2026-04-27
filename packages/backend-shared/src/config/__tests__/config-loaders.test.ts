/**
 * Unit Tests for Configuration File Loaders
 *
 * Tests environment-specific configuration file loading, default value handling,
 * and required field validation as specified in Requirements 3.2, 3.4, 3.5
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ConfigFileLoader,
  ConfigLoadError,
  loadConfig,
  loadEnvironmentConfig,
  loadConfigFromFile,
} from '../loaders';
import { AMQPConfigSchema, RedisConfigSchema } from '../validators';

describe('Configuration File Loaders', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create temporary directory for test config files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('ConfigFileLoader - Basic Loading', () => {
    it('should load JSON configuration file', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        host: 'localhost',
        port: 5672,
        exchange: 'events',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({ configDir: tempDir });
      const result = await loader.loadConfigFile(configPath, 'json');

      expect(result).toEqual(configData);
    });

    it('should load YAML configuration file', async () => {
      const configPath = path.join(tempDir, 'config.yaml');
      const configContent = `
host: localhost
port: 5672
exchange: events
`;

      fs.writeFileSync(configPath, configContent);

      const loader = new ConfigFileLoader({ configDir: tempDir });
      const result = await loader.loadConfigFile(configPath, 'yaml');

      expect(result).toEqual({
        host: 'localhost',
        port: 5672,
        exchange: 'events',
      });
    });

    it('should throw error for invalid JSON', async () => {
      const configPath = path.join(tempDir, 'config.json');
      fs.writeFileSync(configPath, 'invalid json {');

      const loader = new ConfigFileLoader({ configDir: tempDir });

      await expect(loader.loadConfigFile(configPath, 'json')).rejects.toThrow(ConfigLoadError);
    });

    it('should throw error for non-existent file', async () => {
      const configPath = path.join(tempDir, 'non-existent.json');

      const loader = new ConfigFileLoader({ configDir: tempDir });

      await expect(loader.loadConfigFile(configPath, 'json')).rejects.toThrow(ConfigLoadError);
    });
  });

  describe('ConfigFileLoader - Environment-Specific Loading', () => {
    it('should load base configuration file', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const baseConfig = {
        host: 'localhost',
        port: 5672,
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        environment: 'development',
      });

      const result = await loader.loadConfig();

      expect(result.config).toMatchObject(baseConfig);
    });

    it('should merge environment-specific configuration with base', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const envConfigPath = path.join(tempDir, 'config.development.json');

      const baseConfig = {
        host: 'localhost',
        port: 5672,
        exchange: 'events',
      };

      const envConfig = {
        host: 'dev.example.com',
        port: 5673,
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(envConfigPath, JSON.stringify(envConfig));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        environment: 'development',
      });

      const result = await loader.loadConfig();

      expect(result.config).toMatchObject({
        host: 'dev.example.com',
        port: 5673,
        exchange: 'events',
      });
    });

    it('should load production configuration', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const prodConfigPath = path.join(tempDir, 'config.production.json');

      const baseConfig = {
        host: 'localhost',
        port: 5672,
      };

      const prodConfig = {
        host: 'prod.example.com',
        port: 5672,
        ssl: true,
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(prodConfigPath, JSON.stringify(prodConfig));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        environment: 'production',
      });

      const result = await loader.loadConfig();

      expect(result.config).toMatchObject({
        host: 'prod.example.com',
        port: 5672,
        ssl: true,
      });
    });

    it('should detect environment from NODE_ENV', async () => {
      const originalEnv = process.env.NODE_ENV;

      try {
        process.env.NODE_ENV = 'staging';

        const loader = new ConfigFileLoader({ configDir: tempDir });

        expect(loader['environment']).toBe('staging');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('ConfigFileLoader - Default Values', () => {
    it('should apply default values when mergeDefaults is enabled', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        exchange: 'events',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        mergeDefaults: true,
      });

      const result = await loader.loadConfig();

      // Should have defaults applied
      expect(result.config).toHaveProperty('NODE_ENV');
      expect(result.config).toHaveProperty('PORT', 3000);
      expect(result.config).toHaveProperty('LOG_LEVEL', 'info');
      expect(result.config.amqp).toHaveProperty('prefetchCount', 10);
      expect(result.config.redis).toHaveProperty('port', 6379);
    });

    it('should not override provided values with defaults', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        PORT: 8080,
        LOG_LEVEL: 'debug',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        mergeDefaults: true,
      });

      const result = await loader.loadConfig();

      expect(result.config.PORT).toBe(8080);
      expect(result.config.LOG_LEVEL).toBe('debug');
    });

    it('should skip default values when mergeDefaults is disabled', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        exchange: 'events',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        mergeDefaults: false,
      });

      const result = await loader.loadConfig();

      expect(result.config).not.toHaveProperty('PORT');
      expect(result.config).not.toHaveProperty('LOG_LEVEL');
    });
  });

  describe('ConfigFileLoader - Validation', () => {
    it('should validate configuration against schema', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        validate: true,
      });

      const result = await loader.loadConfig(AMQPConfigSchema);

      expect(result.config).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should report validation errors', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        exchange: 'events',
        // Missing required fields: url, queue, routingKeys
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        validate: true,
      });

      const result = await loader.loadConfig(AMQPConfigSchema);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toBeInstanceOf(ConfigLoadError);
    });

    it('should skip validation when validate is disabled', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        exchange: 'events',
        // Missing required fields
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        validate: false,
      });

      const result = await loader.loadConfig(AMQPConfigSchema);

      expect(result.errors).toHaveLength(0);
    });
  });

  describe('ConfigFileLoader - File Discovery', () => {
    it('should discover configuration files by pattern', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const appConfigPath = path.join(tempDir, 'app.json');

      fs.writeFileSync(configPath, JSON.stringify({ port: 3000 }));
      fs.writeFileSync(appConfigPath, JSON.stringify({ name: 'app' }));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        filePatterns: ['config', 'app'],
      });

      const files = await loader['discoverConfigFiles']();

      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.path.includes('config.json'))).toBe(true);
    });

    it('should prefer YAML over JSON when both exist', async () => {
      const jsonPath = path.join(tempDir, 'config.json');
      const yamlPath = path.join(tempDir, 'config.yaml');

      fs.writeFileSync(jsonPath, JSON.stringify({ source: 'json' }));
      fs.writeFileSync(yamlPath, 'source: yaml');

      const loader = new ConfigFileLoader({
        configDir: tempDir,
      });

      const result = await loader.loadConfig();

      expect(result.config.source).toBe('yaml');
    });

    it('should handle missing configuration files gracefully', async () => {
      const loader = new ConfigFileLoader({
        configDir: tempDir,
      });

      const result = await loader.loadConfig();

      // Should not throw, just return empty config with defaults
      expect(result).toBeDefined();
      expect(result.config).toBeDefined();
    });
  });

  describe('ConfigFileLoader - Deep Merging', () => {
    it('should deep merge nested configuration objects', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const envConfigPath = path.join(tempDir, 'config.development.json');

      const baseConfig = {
        database: {
          host: 'localhost',
          port: 5432,
          ssl: false,
        },
      };

      const envConfig = {
        database: {
          host: 'dev.db.example.com',
        },
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(envConfigPath, JSON.stringify(envConfig));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        environment: 'development',
        mergeDefaults: false,
      });

      const result = await loader.loadConfig();

      expect(result.config.database).toEqual({
        host: 'dev.db.example.com',
        port: 5432,
        ssl: false,
      });
    });

    it('should not merge arrays, should replace them', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const envConfigPath = path.join(tempDir, 'config.development.json');

      const baseConfig = {
        routingKeys: ['key1', 'key2'],
      };

      const envConfig = {
        routingKeys: ['key3'],
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(envConfigPath, JSON.stringify(envConfig));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        environment: 'development',
        mergeDefaults: false,
      });

      const result = await loader.loadConfig();

      expect(result.config.routingKeys).toEqual(['key3']);
    });
  });

  describe('Convenience Functions', () => {
    it('should load configuration with loadConfig function', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const result = await loadConfig(AMQPConfigSchema, {
        configDir: tempDir,
        validate: true,
      });

      expect(result.config).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should load environment-specific config with loadEnvironmentConfig', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const prodConfigPath = path.join(tempDir, 'config.production.json');

      const baseConfig = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      const prodConfig = {
        url: 'amqp://prod.example.com:5672',
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(prodConfigPath, JSON.stringify(prodConfig));

      const result = await loadEnvironmentConfig('production', AMQPConfigSchema, tempDir);

      expect(result.config.url).toBe('amqp://prod.example.com:5672');
      expect(result.config.exchange).toBe('events');
    });

    it('should load configuration from specific file', async () => {
      const configPath = path.join(tempDir, 'custom-config.json');
      const configData = {
        host: 'localhost',
        port: 6379,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const result = await loadConfigFromFile(configPath, RedisConfigSchema);

      expect(result).toMatchObject(configData);
    });

    it('should throw error for unsupported file format', async () => {
      const configPath = path.join(tempDir, 'config.txt');
      fs.writeFileSync(configPath, 'some content');

      await expect(loadConfigFromFile(configPath)).rejects.toThrow(ConfigLoadError);
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error messages', async () => {
      const configPath = path.join(tempDir, 'config.json');
      fs.writeFileSync(configPath, 'invalid json');

      const loader = new ConfigFileLoader({ configDir: tempDir });

      try {
        await loader.loadConfigFile(configPath, 'json');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ConfigLoadError);
        expect((error as ConfigLoadError).filePath).toBe(configPath);
        expect((error as ConfigLoadError).cause).toBeDefined();
      }
    });

    it('should collect multiple errors during loading', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        exchange: 'events',
        // Missing required fields
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const loader = new ConfigFileLoader({
        configDir: tempDir,
        validate: true,
      });

      const result = await loader.loadConfig(AMQPConfigSchema);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
    });
  });

  describe('Configuration Loading Result', () => {
    it('should return sources information', async () => {
      const configPath = path.join(tempDir, 'config.json');
      fs.writeFileSync(configPath, JSON.stringify({ port: 3000 }));

      const loader = new ConfigFileLoader({ configDir: tempDir });
      const result = await loader.loadConfig();

      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
    });

    it('should return errors array', async () => {
      const loader = new ConfigFileLoader({ configDir: tempDir });
      const result = await loader.loadConfig();

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
