/**
 * Property-Based Tests for Configuration Round-trip Consistency
 *
 * **Validates: Requirements 1.7, 3.6**
 *
 * Property 2: Configuration Round-trip Consistency
 * For any valid configuration object, serializing and deserializing the configuration
 * SHALL produce an equivalent configuration with all required fields preserved.
 */

import * as fc from 'fast-check';
import { ConfigService } from '../config.service';
import {
  AMQPConfigSchema,
  BootstrapConfigSchema,
  DatabaseConfigSchema,
  HealthConfigSchema,
  MetricsConfigSchema,
  RedisConfigSchema,
} from '../validators';

describe('Property 2: Configuration Round-trip Consistency', () => {
  /**
   * Test generators for various configuration types
   */

  // Generator for valid AMQP configuration
  const validAMQPConfigArb = fc.record({
    url: fc.constant('amqp://localhost:5672'),
    exchange: fc.string({ minLength: 1, maxLength: 50 }),
    queue: fc.string({ minLength: 1, maxLength: 50 }),
    routingKeys: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
      minLength: 1,
      maxLength: 5,
    }),
    prefetchCount: fc
      .option(fc.integer({ min: 1, max: 1000 }), { freq: 2 })
      .filter((v) => v !== null),
    reconnectInterval: fc
      .option(fc.integer({ min: 1000, max: 60000 }), { freq: 2 })
      .filter((v) => v !== null),
    maxReconnectAttempts: fc
      .option(fc.integer({ min: 1, max: 50 }), { freq: 2 })
      .filter((v) => v !== null),
    deadLetterExchange: fc
      .option(fc.string({ minLength: 1, maxLength: 50 }), { freq: 2 })
      .filter((v) => v !== null),
    deadLetterQueue: fc
      .option(fc.string({ minLength: 1, maxLength: 50 }), { freq: 2 })
      .filter((v) => v !== null),
  });

  // Generator for valid Redis configuration
  const validRedisConfigArb = fc.record({
    host: fc.string({ minLength: 1, maxLength: 100 }),
    port: fc.integer({ min: 1, max: 65535 }),
    password: fc
      .option(fc.string({ minLength: 1, maxLength: 100 }), { freq: 2 })
      .filter((v) => v !== null),
    db: fc.option(fc.integer({ min: 0, max: 15 }), { freq: 2 }).filter((v) => v !== null),
    maxRetriesPerRequest: fc
      .option(fc.integer({ min: 1, max: 10 }), { freq: 2 })
      .filter((v) => v !== null),
    retryDelayOnFailover: fc
      .option(fc.integer({ min: 1, max: 1000 }), { freq: 2 })
      .filter((v) => v !== null),
    lazyConnect: fc.option(fc.boolean(), { freq: 2 }).filter((v) => v !== null),
  });

  // Generator for valid Database configuration
  const validDatabaseConfigArb = fc.record({
    host: fc.string({ minLength: 1, maxLength: 100 }),
    port: fc.integer({ min: 1, max: 65535 }),
    database: fc.string({ minLength: 1, maxLength: 50 }),
    username: fc.string({ minLength: 1, maxLength: 50 }),
    password: fc.string({ minLength: 1, maxLength: 100 }),
    ssl: fc.option(fc.boolean(), { freq: 2 }).filter((v) => v !== null),
    connectionTimeoutMillis: fc
      .option(fc.integer({ min: 1000, max: 120000 }), { freq: 2 })
      .filter((v) => v !== null),
    idleTimeoutMillis: fc
      .option(fc.integer({ min: 1000, max: 120000 }), { freq: 2 })
      .filter((v) => v !== null),
    max: fc.option(fc.integer({ min: 1, max: 100 }), { freq: 2 }).filter((v) => v !== null),
  });

  // Generator for valid Health configuration
  const validHealthConfigArb = fc.record({
    endpoints: fc.record({
      health: fc.string({ minLength: 1, maxLength: 50 }),
      ready: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    dependencies: fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 50 }),
        type: fc.constantFrom('database', 'redis', 'rabbitmq', 'grpc', 'http'),
        config: fc.record({ timeout: fc.integer({ min: 1000, max: 30000 }) }),
        timeout: fc
          .option(fc.integer({ min: 1000, max: 30000 }), { freq: 2 })
          .filter((v) => v !== null),
      }),
      { maxLength: 3 },
    ),
  });

  // Generator for valid Metrics configuration
  const validMetricsConfigArb = fc.record({
    enabled: fc.option(fc.boolean(), { freq: 2 }).filter((v) => v !== null),
    prefix: fc
      .option(fc.string({ minLength: 1, maxLength: 50 }), { freq: 2 })
      .filter((v) => v !== null),
    defaultLabels: fc
      .option(
        fc.record({
          service: fc.string({ minLength: 1, maxLength: 50 }),
          environment: fc.constantFrom('dev', 'staging', 'prod'),
        }),
        { freq: 2 },
      )
      .filter((v) => v !== null),
    collectDefaultMetrics: fc.option(fc.boolean(), { freq: 2 }).filter((v) => v !== null),
  });

  // Generator for valid Bootstrap configuration
  const validBootstrapConfigArb = fc.record({
    port: fc.option(fc.integer({ min: 1, max: 65535 }), { freq: 2 }).filter((v) => v !== null),
    globalPrefix: fc
      .option(fc.string({ minLength: 1, maxLength: 50 }), { freq: 2 })
      .filter((v) => v !== null),
    cors: fc
      .option(
        fc.record({
          origin: fc
            .option(fc.constantFrom(true, false, 'http://localhost:3000'), { freq: 2 })
            .filter((v) => v !== null),
          credentials: fc.option(fc.boolean(), { freq: 2 }).filter((v) => v !== null),
        }),
        { freq: 2 },
      )
      .filter((v) => v !== null),
    gracefulShutdownTimeout: fc
      .option(fc.integer({ min: 1000, max: 120000 }), { freq: 2 })
      .filter((v) => v !== null),
  });

  /**
   * Helper function to serialize configuration to JSON
   */
  const serializeConfig = (config: Record<string, unknown>): string => {
    return JSON.stringify(config);
  };

  /**
   * Helper function to deserialize configuration from JSON
   */
  const deserializeConfig = (json: string): Record<string, unknown> => {
    return JSON.parse(json);
  };

  /**
   * Helper function to check if two configurations are equivalent
   * Handles optional fields and default values
   */
  const areConfigsEquivalent = (original: unknown, deserialized: unknown): boolean => {
    // Check if both are objects
    if (typeof original !== 'object' || typeof deserialized !== 'object') {
      return original === deserialized;
    }

    // Check if both are null
    if (original === null && deserialized === null) {
      return true;
    }

    // Check if one is null and the other is not
    if ((original === null) !== (deserialized === null)) {
      return false;
    }

    // Check if both are arrays
    if (Array.isArray(original) && Array.isArray(deserialized)) {
      if (original.length !== deserialized.length) {
        return false;
      }
      return original.every((item, index) => areConfigsEquivalent(item, deserialized[index]));
    }

    // Check if both are objects (but not arrays)
    if (Array.isArray(original) !== Array.isArray(deserialized)) {
      return false;
    }

    // Compare object keys
    const originalKeys = Object.keys(original as Record<string, unknown>).sort();
    const deserializedKeys = Object.keys(deserialized as Record<string, unknown>).sort();

    if (originalKeys.length !== deserializedKeys.length) {
      return false;
    }

    // Compare each key-value pair
    return originalKeys.every((key) => {
      if (!deserializedKeys.includes(key)) {
        return false;
      }
      return areConfigsEquivalent(
        (original as Record<string, unknown>)[key],
        (deserialized as Record<string, unknown>)[key],
      );
    });
  };

  /**
   * Property Test: AMQP configuration round-trip consistency
   */
  it('should maintain AMQP configuration consistency through serialization round-trip', () => {
    fc.assert(
      fc.property(validAMQPConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: AMQPConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify equivalence
        expect(areConfigsEquivalent(config, deserialized)).toBe(true);

        // Verify all required fields are preserved
        expect(deserialized).toHaveProperty('url');
        expect(deserialized).toHaveProperty('exchange');
        expect(deserialized).toHaveProperty('queue');
        expect(deserialized).toHaveProperty('routingKeys');

        // Verify values match
        expect(deserialized.url).toBe(config.url);
        expect(deserialized.exchange).toBe(config.exchange);
        expect(deserialized.queue).toBe(config.queue);
        expect(deserialized.routingKeys).toEqual(config.routingKeys);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Redis configuration round-trip consistency
   */
  it('should maintain Redis configuration consistency through serialization round-trip', () => {
    fc.assert(
      fc.property(validRedisConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: RedisConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify equivalence
        expect(areConfigsEquivalent(config, deserialized)).toBe(true);

        // Verify all required fields are preserved
        expect(deserialized).toHaveProperty('host');
        expect(deserialized).toHaveProperty('port');

        // Verify values match
        expect(deserialized.host).toBe(config.host);
        expect(deserialized.port).toBe(config.port);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Database configuration round-trip consistency
   */
  it('should maintain Database configuration consistency through serialization round-trip', () => {
    fc.assert(
      fc.property(validDatabaseConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: DatabaseConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify equivalence
        expect(areConfigsEquivalent(config, deserialized)).toBe(true);

        // Verify all required fields are preserved
        expect(deserialized).toHaveProperty('host');
        expect(deserialized).toHaveProperty('port');
        expect(deserialized).toHaveProperty('database');
        expect(deserialized).toHaveProperty('username');
        expect(deserialized).toHaveProperty('password');

        // Verify values match
        expect(deserialized.host).toBe(config.host);
        expect(deserialized.port).toBe(config.port);
        expect(deserialized.database).toBe(config.database);
        expect(deserialized.username).toBe(config.username);
        expect(deserialized.password).toBe(config.password);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Health configuration round-trip consistency
   */
  it('should maintain Health configuration consistency through serialization round-trip', () => {
    fc.assert(
      fc.property(validHealthConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: HealthConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify equivalence
        expect(areConfigsEquivalent(config, deserialized)).toBe(true);

        // Verify all required fields are preserved
        expect(deserialized).toHaveProperty('endpoints');
        const typedDeserialized = deserialized as { endpoints: { health: string; ready: string } };
        const typedConfig = config as { endpoints: { health: string; ready: string } };
        expect(typedDeserialized.endpoints).toHaveProperty('health');
        expect(typedDeserialized.endpoints).toHaveProperty('ready');

        // Verify values match
        expect(typedDeserialized.endpoints.health).toBe(typedConfig.endpoints.health);
        expect(typedDeserialized.endpoints.ready).toBe(typedConfig.endpoints.ready);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Metrics configuration round-trip consistency
   */
  it('should maintain Metrics configuration consistency through serialization round-trip', () => {
    fc.assert(
      fc.property(validMetricsConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: MetricsConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify equivalence
        expect(areConfigsEquivalent(config, deserialized)).toBe(true);

        // Verify all required fields are preserved
        expect(deserialized).toHaveProperty('enabled');

        // Verify values match
        expect(deserialized.enabled).toBe(config.enabled);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Bootstrap configuration round-trip consistency
   */
  it('should maintain Bootstrap configuration consistency through serialization round-trip', () => {
    fc.assert(
      fc.property(validBootstrapConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: BootstrapConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify equivalence
        expect(areConfigsEquivalent(config, deserialized)).toBe(true);

        // Verify values match
        expect(deserialized.port).toBe(config.port);
        expect(deserialized.globalPrefix).toBe(config.globalPrefix);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Complex configuration round-trip consistency
   * Tests with nested and optional fields
   */
  it('should maintain complex configuration consistency with nested and optional fields', () => {
    const complexConfigArb = fc.record({
      url: fc.constant('amqp://localhost:5672'),
      exchange: fc.string({ minLength: 1, maxLength: 50 }),
      queue: fc.string({ minLength: 1, maxLength: 50 }),
      routingKeys: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
        minLength: 1,
        maxLength: 5,
      }),
      prefetchCount: fc.integer({ min: 1, max: 1000 }),
      reconnectInterval: fc.integer({ min: 1000, max: 60000 }),
      maxReconnectAttempts: fc.integer({ min: 1, max: 50 }),
      deadLetterExchange: fc
        .option(fc.string({ minLength: 1, maxLength: 50 }), { freq: 2 })
        .filter((v) => v !== null),
      deadLetterQueue: fc
        .option(fc.string({ minLength: 1, maxLength: 50 }), { freq: 2 })
        .filter((v) => v !== null),
    });

    fc.assert(
      fc.property(complexConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: AMQPConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify equivalence
        expect(areConfigsEquivalent(config, deserialized)).toBe(true);

        // Verify all fields are preserved
        Object.keys(config).forEach((key) => {
          expect(deserialized).toHaveProperty(key);
          expect((deserialized as Record<string, unknown>)[key]).toEqual(
            config[key as keyof typeof config],
          );
        });
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Configuration type preservation through round-trip
   * Ensures that types (strings, numbers, booleans, arrays, objects) are preserved
   */
  it('should preserve configuration field types through serialization round-trip', () => {
    fc.assert(
      fc.property(validAMQPConfigArb, (originalConfig: Record<string, unknown>) => {
        // Create ConfigService with original config
        const configService = new ConfigService({
          schema: AMQPConfigSchema,
          envOverrides: originalConfig,
          validateOnLoad: true,
        });

        // Get the configuration
        const config = configService.getAll();

        // Serialize to JSON
        const serialized = serializeConfig(config);

        // Deserialize from JSON
        const deserialized = deserializeConfig(serialized);

        // Verify type preservation for each field
        expect(typeof deserialized.url).toBe(typeof config.url);
        expect(typeof deserialized.exchange).toBe(typeof config.exchange);
        expect(typeof deserialized.queue).toBe(typeof config.queue);
        expect(Array.isArray(deserialized.routingKeys)).toBe(Array.isArray(config.routingKeys));
        expect(typeof deserialized.prefetchCount).toBe(typeof config.prefetchCount);
        expect(typeof deserialized.reconnectInterval).toBe(typeof config.reconnectInterval);
        expect(typeof deserialized.maxReconnectAttempts).toBe(typeof config.maxReconnectAttempts);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Configuration array field preservation
   * Ensures that array fields maintain their structure and content
   */
  it('should preserve array fields in configuration through round-trip', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (routingKeys: string[]) => {
          const config = {
            url: 'amqp://localhost:5672',
            exchange: 'test-exchange',
            queue: 'test-queue',
            routingKeys,
          };

          // Serialize to JSON
          const serialized = serializeConfig(config);

          // Deserialize from JSON
          const deserialized = deserializeConfig(serialized);

          const typedDeserialized = deserialized as { routingKeys: string[] };
          const typedConfig = config as { routingKeys: string[] };
          expect(Array.isArray(typedDeserialized.routingKeys)).toBe(true);
          expect(typedDeserialized.routingKeys.length).toBe(typedConfig.routingKeys.length);
          expect(typedDeserialized.routingKeys).toEqual(typedConfig.routingKeys);

          // Verify each element
          typedDeserialized.routingKeys.forEach((key: string, index: number) => {
            expect(key).toBe(typedConfig.routingKeys[index]);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Configuration with null and undefined handling
   * Ensures that null and undefined values are handled consistently
   */
  it('should handle null and undefined values consistently through round-trip', () => {
    fc.assert(
      fc.property(
        fc.record({
          url: fc.constant('amqp://localhost:5672'),
          exchange: fc.string({ minLength: 1, maxLength: 50 }),
          queue: fc.string({ minLength: 1, maxLength: 50 }),
          routingKeys: fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
            minLength: 1,
            maxLength: 5,
          }),
          deadLetterExchange: fc.oneof(
            fc.constant(undefined),
            fc.string({ minLength: 1, maxLength: 50 }),
          ),
        }),
        (config: Record<string, unknown>) => {
          // Serialize to JSON (undefined becomes null in JSON)
          const serialized = serializeConfig(config);

          // Deserialize from JSON
          const deserialized = deserializeConfig(serialized);

          // Verify that undefined values become null in JSON (standard JSON behavior)
          if (config.deadLetterExchange === undefined) {
            expect(deserialized.deadLetterExchange).toBeUndefined();
          }

          // Verify that string values are preserved
          if (typeof config.deadLetterExchange === 'string') {
            expect(deserialized.deadLetterExchange).toBe(config.deadLetterExchange);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
