/**
 * Integration Tests for ConfigService with File Loaders
 *
 * Tests integration between ConfigService and ConfigFileLoader,
 * ensuring environment-specific configuration loading works correctly
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigService, ConfigServiceFactory } from '../config.service';
import { AMQPConfigSchema } from '../validators';

describe('ConfigService Integration with File Loaders', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-integration-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('ConfigService.loadFromFiles', () => {
    it('should load and validate configuration from files', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
      });

      expect(configService.get('url')).toBe('amqp://localhost:5672');
      expect(configService.get('exchange')).toBe('events');
      expect(configService.get('queue')).toBe('test-queue');
    });

    it('should merge environment-specific configuration', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const devConfigPath = path.join(tempDir, 'config.development.json');

      const baseConfig = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      const devConfig = {
        url: 'amqp://dev.example.com:5672',
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(devConfigPath, JSON.stringify(devConfig));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        environment: 'development',
      });

      expect(configService.get('url')).toBe('amqp://dev.example.com:5672');
      expect(configService.get('exchange')).toBe('events');
    });

    it('should throw error if configuration validation fails', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        exchange: 'events',
        // Missing required fields
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(
        ConfigService.loadFromFiles(AMQPConfigSchema, {
          configDir: tempDir,
        }),
      ).rejects.toThrow();
    });

    it('should apply default values during loading', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        mergeDefaults: true,
      });

      // Should have defaults applied
      expect(configService.get('prefetchCount')).toBe(10);
      expect(configService.get('reconnectInterval')).toBe(5000);
    });
  });

  describe('ConfigServiceFactory - File Loading Methods', () => {
    it('should load AMQP configuration from files', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigServiceFactory.loadAMQPConfigFromFiles({
        configDir: tempDir,
      });

      expect(configService.get('url')).toBe('amqp://localhost:5672');
    });

    it('should load Redis configuration from files', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        host: 'localhost',
        port: 6379,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigServiceFactory.loadRedisConfigFromFiles({
        configDir: tempDir,
      });

      expect(configService.get('host')).toBe('localhost');
      expect(configService.get('port')).toBe(6379);
    });

    it('should load Database configuration from files', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        host: 'localhost',
        port: 5432,
        database: 'mydb',
        username: 'user',
        password: 'pass',
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigServiceFactory.loadDatabaseConfigFromFiles({
        configDir: tempDir,
      });

      expect(configService.get('host')).toBe('localhost');
      expect(configService.get('port')).toBe(5432);
    });
  });

  describe('Environment-Specific Configuration Loading', () => {
    it('should load production configuration', async () => {
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
        prefetchCount: 50,
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(prodConfigPath, JSON.stringify(prodConfig));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        environment: 'production',
      });

      expect(configService.get('url')).toBe('amqp://prod.example.com:5672');
      expect(configService.get('prefetchCount')).toBe(50);
    });

    it('should load staging configuration', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const stagingConfigPath = path.join(tempDir, 'config.staging.json');

      const baseConfig = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      const stagingConfig = {
        url: 'amqp://staging.example.com:5672',
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(stagingConfigPath, JSON.stringify(stagingConfig));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        environment: 'staging',
      });

      expect(configService.get('url')).toBe('amqp://staging.example.com:5672');
    });

    it('should load test configuration', async () => {
      const baseConfigPath = path.join(tempDir, 'config.json');
      const testConfigPath = path.join(tempDir, 'config.test.json');

      const baseConfig = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      const testConfig = {
        url: 'amqp://localhost:5672',
        prefetchCount: 1,
      };

      fs.writeFileSync(baseConfigPath, JSON.stringify(baseConfig));
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        environment: 'test',
      });

      expect(configService.get('prefetchCount')).toBe(1);
    });
  });

  describe('Default Values and Validation', () => {
    it('should apply default values for optional fields', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
        // Optional fields not provided
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        mergeDefaults: true,
      });

      // Should have defaults for optional fields
      expect(configService.get('prefetchCount')).toBe(10);
      expect(configService.get('reconnectInterval')).toBe(5000);
      expect(configService.get('maxReconnectAttempts')).toBe(10);
    });

    it('should validate required fields are present', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        exchange: 'events',
        // Missing required fields: url, queue, routingKeys
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      await expect(
        ConfigService.loadFromFiles(AMQPConfigSchema, {
          configDir: tempDir,
        }),
      ).rejects.toThrow();
    });

    it('should provide descriptive validation errors', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'not-a-valid-amqp-url',
        exchange: '',
        queue: 'test-queue',
        routingKeys: [],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      try {
        await ConfigService.loadFromFiles(AMQPConfigSchema, {
          configDir: tempDir,
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain('Configuration loading failed');
      }
    });
  });

  describe('Multiple Configuration Files', () => {
    it('should load multiple configuration files in priority order', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const appConfigPath = path.join(tempDir, 'app.json');

      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      const appData = {
        prefetchCount: 20,
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));
      fs.writeFileSync(appConfigPath, JSON.stringify(appData));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        filePatterns: ['config', 'app'],
      });

      expect(configService.get('url')).toBe('amqp://localhost:5672');
      expect(configService.get('prefetchCount')).toBe(20);
    });
  });

  describe('Configuration Access Methods', () => {
    it('should get configuration values', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
      });

      expect(configService.get('url')).toBe('amqp://localhost:5672');
      expect(configService.get('exchange')).toBe('events');
    });

    it('should get all configuration', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
      });

      const allConfig = configService.getAll();

      expect(allConfig).toHaveProperty('url');
      expect(allConfig).toHaveProperty('exchange');
      expect(allConfig).toHaveProperty('queue');
    });

    it('should check if configuration key exists', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const configData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      fs.writeFileSync(configPath, JSON.stringify(configData));

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
      });

      expect(configService.has('url')).toBe(true);
      expect(configService.has('nonexistent' as never)).toBe(false);
    });
  });

  describe('YAML Configuration Files', () => {
    it('should load YAML configuration files', async () => {
      const configPath = path.join(tempDir, 'config.yaml');
      const configContent = `
url: amqp://localhost:5672
exchange: events
queue: test-queue
routingKeys:
  - test.key
`;

      fs.writeFileSync(configPath, configContent);

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
      });

      expect(configService.get('url')).toBe('amqp://localhost:5672');
      expect(configService.get('exchange')).toBe('events');
    });

    it('should merge YAML and JSON configurations', async () => {
      const jsonPath = path.join(tempDir, 'config.json');
      const yamlPath = path.join(tempDir, 'config.development.yaml');

      const jsonData = {
        url: 'amqp://localhost:5672',
        exchange: 'events',
        queue: 'test-queue',
        routingKeys: ['test.key'],
      };

      const yamlContent = `
url: amqp://dev.example.com:5672
prefetchCount: 20
`;

      fs.writeFileSync(jsonPath, JSON.stringify(jsonData));
      fs.writeFileSync(yamlPath, yamlContent);

      const configService = await ConfigService.loadFromFiles(AMQPConfigSchema, {
        configDir: tempDir,
        environment: 'development',
      });

      expect(configService.get('url')).toBe('amqp://dev.example.com:5672');
      expect(configService.get('exchange')).toBe('events');
      expect(configService.get('prefetchCount')).toBe(20);
    });
  });
});
