/**
 * Property-Based Tests for Configuration Validation
 *
 * **Validates: Requirements 3.3, 3.5, 6.5**
 *
 * Property 4: Configuration Validation Completeness
 * For any configuration schema and input data, the configuration module SHALL
 * validate all required fields and provide descriptive errors for any validation failures.
 */

import * as fc from 'fast-check';
import { z } from 'zod';
import { ConfigService, ConfigurationValidationError } from '../config.service';
import { AMQPConfigSchema, RedisConfigSchema } from '../validators';

// Use global Jest types with local assignments to help IDE discovery
const { describe, it, expect } = global as any;

describe('Property 4: Configuration Validation Completeness', () => {
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
    prefetchCount: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
    reconnectInterval: fc.option(fc.integer({ min: 1000, max: 60000 }), { nil: undefined }),
    maxReconnectAttempts: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
  });

  // Generator for invalid AMQP configuration (missing required fields)
  const invalidAMQPConfigArb = fc.oneof(
    // Missing url
    fc.record({
      exchange: fc.string({ minLength: 1 }),
      queue: fc.string({ minLength: 1 }),
      routingKeys: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
    }),
    // Empty exchange
    fc.record({
      url: fc.constant('amqp://localhost:5672'),
      exchange: fc.constant(''),
      queue: fc.string({ minLength: 1 }),
      routingKeys: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
    }),
    // Empty routing keys array
    fc.record({
      url: fc.constant('amqp://localhost:5672'),
      exchange: fc.string({ minLength: 1 }),
      queue: fc.string({ minLength: 1 }),
      routingKeys: fc.constant([]),
    }),
  );

  // Generator for valid Redis configuration
  const validRedisConfigArb = fc.record({
    host: fc.string({ minLength: 1, maxLength: 100 }),
    port: fc.integer({ min: 1, max: 65535 }),
    password: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    db: fc.option(fc.integer({ min: 0, max: 15 }), { nil: undefined }),
  });

  // Generator for configuration with missing required fields
  const configWithMissingFieldsArb = fc.record({
    someField: fc.string(),
    anotherField: fc.integer(),
  });

  // Generator for configuration with invalid field types (as unknown to bypass TS)
  const configWithInvalidTypesArb = fc.record({
    url: fc.integer(),
    port: fc.string(),
    enabled: fc.string(),
  }) as fc.Arbitrary<unknown>;

  /**
   * Property Test: Valid configurations should pass validation
   */
  it('should validate all required fields for valid configurations', () => {
    fc.assert(
      fc.property(validAMQPConfigArb, (config) => {
        // Create ConfigService with AMQP schema
        const configService = new ConfigService({
          schema: AMQPConfigSchema,
          envOverrides: config as any,
          validateOnLoad: true,
        });

        // Should not throw and should return the validated config
        expect(configService.getAll()).toBeDefined();
        expect(configService.get('url')).toBe(config.url);
        expect(configService.get('exchange')).toBe(config.exchange);
        expect(configService.get('queue')).toBe(config.queue);
        expect(configService.get('routingKeys')).toEqual(config.routingKeys);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Invalid configurations should provide descriptive errors
   */
  it('should provide descriptive errors for invalid configurations', () => {
    fc.assert(
      fc.property(invalidAMQPConfigArb, (invalidConfig) => {
        // Should throw ConfigurationValidationError with descriptive message
        expect(() => {
          new ConfigService({
            schema: AMQPConfigSchema,
            envOverrides: invalidConfig as Record<string, unknown>,
            validateOnLoad: true,
          });
        }).toThrow(ConfigurationValidationError);

        // Verify error contains descriptive information
        try {
          new ConfigService({
            schema: AMQPConfigSchema,
            envOverrides: invalidConfig as Record<string, unknown>,
            validateOnLoad: true,
          });
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(ConfigurationValidationError);
          expect((error as any).message).toContain('Configuration validation failed');
          expect((error as any).validationErrors).toBeDefined();
          expect(Array.isArray((error as any).validationErrors)).toBe(true);
          expect((error as any).validationErrors.length).toBeGreaterThan(0);

          // Each validation error should have descriptive information
          (error as ConfigurationValidationError).validationErrors.forEach(
            (validationError: any) => {
              expect(validationError).toHaveProperty('path');
              expect(validationError).toHaveProperty('message');
              expect(typeof validationError.message).toBe('string');
              expect((validationError.message as string).length).toBeGreaterThan(0);
            },
          );
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Configuration validation completeness across different schemas
   */
  it('should validate all required fields across different configuration schemas', () => {
    const schemas = [
      { name: 'AMQP', schema: AMQPConfigSchema, validConfig: validAMQPConfigArb },
      { name: 'Redis', schema: RedisConfigSchema, validConfig: validRedisConfigArb },
    ];

    schemas.forEach(({ name: _name, schema, validConfig }) => {
      fc.assert(
        fc.property(validConfig, (config) => {
          // Valid configuration should pass validation
          const configService = new ConfigService({
            schema: schema as z.ZodSchema<Record<string, unknown>>,
            envOverrides: config as Record<string, unknown>,
            validateOnLoad: true,
          });

          expect(configService.getAll()).toBeDefined();

          // All required fields should be accessible
          Object.keys(config as any).forEach((key) => {
            if ((config as any)[key] !== undefined) {
              expect(configService.has(key as never)).toBe(true);
            }
          });
        }),
        { numRuns: 50, verbose: false },
      );
    });
  });

  /**
   * Property Test: Error message quality and completeness
   */
  it('should provide complete error information for all validation failures', () => {
    fc.assert(
      fc.property(configWithMissingFieldsArb, (invalidConfig) => {
        // Test with a strict schema that requires specific fields
        const strictSchema = z.object({
          requiredString: z.string().min(1, 'Required string field is missing or empty'),
          requiredNumber: z.number().positive('Required number must be positive'),
          requiredBoolean: z.boolean(),
        });

        expect(() => {
          new ConfigService({
            schema: strictSchema,
            envOverrides: invalidConfig as Record<string, unknown>,
            validateOnLoad: true,
          });
        }).toThrow(ConfigurationValidationError);

        try {
          new ConfigService({
            schema: strictSchema,
            envOverrides: invalidConfig as Record<string, unknown>,
            validateOnLoad: true,
          });
        } catch (error: unknown) {
          // Error should contain complete validation information
          expect(error).toBeInstanceOf(ConfigurationValidationError);
          expect((error as any).message).toMatch(/Configuration validation failed:/);

          // Should have validation errors array
          expect((error as any).validationErrors).toBeDefined();
          expect(Array.isArray((error as any).validationErrors)).toBe(true);

          // Each error should have path and message
          (error as ConfigurationValidationError).validationErrors.forEach((err: any) => {
            expect(err).toHaveProperty('path');
            expect(err).toHaveProperty('message');
            expect(Array.isArray(err.path)).toBe(true);
            expect(typeof err.message).toBe('string');
            expect((err.message as string).length).toBeGreaterThan(0);
          });
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Configuration field type validation
   */
  it('should validate field types and provide specific type error messages', () => {
    fc.assert(
      fc.property(configWithInvalidTypesArb, (configWithWrongTypes) => {
        const typeValidationSchema = z.object({
          url: z.string().url('Must be a valid URL'),
          port: z.number().int().positive('Port must be a positive integer'),
          enabled: z.boolean(),
        });

        expect(() => {
          new ConfigService({
            schema: typeValidationSchema,
            envOverrides: configWithWrongTypes as Record<string, unknown>,
            validateOnLoad: true,
          });
        }).toThrow(ConfigurationValidationError);

        try {
          new ConfigService({
            schema: typeValidationSchema,
            envOverrides: configWithWrongTypes as Record<string, unknown>,
            validateOnLoad: true,
          });
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(ConfigurationValidationError);

          // Should have type-specific error messages
          const errorMessages = (error as ConfigurationValidationError).validationErrors.map(
            (err: any) => err.message as string,
          );
          expect(
            errorMessages.some(
              (msg: string) =>
                msg.includes('Expected') ||
                msg.includes('type') ||
                msg.includes('string') ||
                msg.includes('number') ||
                msg.includes('boolean'),
            ),
          ).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Property Test: Environment variable parsing validation
   */
  it('should validate environment variable parsing with proper error handling', () => {
    fc.assert(
      fc.property(
        fc.record({
          INVALID_PORT: fc.string().filter((s) => isNaN(Number(s)) && s !== ''),
          INVALID_BOOLEAN: fc.string().filter((s) => !['true', 'false'].includes(s.toLowerCase())),
        }),
        (envVars) => {
          // Mock process.env temporarily
          const originalEnv = process.env;
          process.env = { ...originalEnv, ...envVars };

          try {
            const schema = z.object({
              INVALID_PORT: z.number().int().positive(),
              INVALID_BOOLEAN: z.boolean(),
            });

            expect(() => {
              new ConfigService({
                schema,
                validateOnLoad: true,
              });
            }).toThrow(ConfigurationValidationError);

            try {
              new ConfigService({
                schema,
                validateOnLoad: true,
              });
            } catch (error: unknown) {
              expect(error).toBeInstanceOf(ConfigurationValidationError);
              expect(
                (error as ConfigurationValidationError).validationErrors.length,
              ).toBeGreaterThan(0);
            }
          } finally {
            // Restore original environment
            process.env = originalEnv;
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});
