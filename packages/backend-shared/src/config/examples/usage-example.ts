/**
 * ConfigService Usage Examples
 *
 * This file demonstrates how to use the ConfigService with different configuration types.
 */

import { z } from 'zod';
import {
  ConfigService,
  ConfigServiceFactory,
  createEnvironmentConfigService,
} from '../config.service';
import {} from '../validators';

// Example 1: Basic Environment Configuration
export function createBasicEnvironmentConfig() {
  // Using the factory function
  const envConfig = createEnvironmentConfigService({
    NODE_ENV: 'development',
    PORT: 3000,
  });

  console.log('Environment Config:');
  console.log('- NODE_ENV:', envConfig.get('NODE_ENV'));
  console.log('- PORT:', envConfig.get('PORT'));
  console.log('- LOG_LEVEL:', envConfig.get('LOG_LEVEL'));

  return envConfig;
}

// Example 2: Custom Configuration with Validation
export function createCustomConfig() {
  const customSchema = z.object({
    serviceName: z.string().min(1, 'Service name is required'),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format'),
    features: z.object({
      authentication: z.boolean().default(true),
      logging: z.boolean().default(true),
      metrics: z.boolean().default(false),
    }),
    database: z.object({
      host: z.string(),
      port: z.number().int().positive(),
      name: z.string(),
    }),
  });

  const config = new ConfigService({
    schema: customSchema,
    envOverrides: {
      serviceName: 'my-service',
      version: '1.0.0',
      features: {
        authentication: true,
        logging: true,
        metrics: true,
      },
      database: {
        host: 'localhost',
        port: 5432,
        name: 'myapp',
      },
    },
  });

  console.log('Custom Config:');
  console.log('- Service Name:', config.get('serviceName'));
  console.log('- Version:', config.get('version'));
  console.log('- Features:', config.get('features'));
  console.log('- Database:', config.get('database'));

  return config;
}

// Example 3: AMQP Configuration using Factory
export function createAMQPConfig() {
  const amqpConfig = ConfigServiceFactory.createAMQPConfig({
    url: 'amqp://localhost:5672',
    exchange: 'events',
    queue: 'my-service.events',
    routingKeys: ['user.created', 'user.updated'],
  });

  console.log('AMQP Config:');
  console.log('- URL:', amqpConfig.get('url'));
  console.log('- Exchange:', amqpConfig.get('exchange'));
  console.log('- Queue:', amqpConfig.get('queue'));
  console.log('- Routing Keys:', amqpConfig.get('routingKeys'));
  console.log('- Prefetch Count:', amqpConfig.get('prefetchCount')); // Default value

  return amqpConfig;
}

// Example 4: Redis Configuration using Factory
export function createRedisConfig() {
  const redisConfig = ConfigServiceFactory.createRedisConfig({
    host: 'localhost',
    port: 6379,
    password: 'secret',
  });

  console.log('Redis Config:');
  console.log('- Host:', redisConfig.get('host'));
  console.log('- Port:', redisConfig.get('port'));
  console.log('- Has Password:', redisConfig.has('password'));
  console.log('- Database:', redisConfig.get('db')); // Default value

  return redisConfig;
}

// Example 5: Environment Variable Loading with Prefix
export function createConfigWithEnvPrefix() {
  // Set some environment variables for demonstration
  process.env.MYAPP_DATABASE_HOST = 'prod-db.example.com';
  process.env.MYAPP_DATABASE_PORT = '5432';
  process.env.MYAPP_REDIS_HOST = 'redis.example.com';
  process.env.MYAPP_REDIS_PORT = '6379';

  const schema = z.object({
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.number(),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.number(),
  });

  const config = new ConfigService({
    schema,
    envPrefix: 'MYAPP_',
  });

  console.log('Config with Env Prefix:');
  console.log('- Database Host:', config.get('DATABASE_HOST'));
  console.log('- Database Port:', config.get('DATABASE_PORT'));
  console.log('- Redis Host:', config.get('REDIS_HOST'));
  console.log('- Redis Port:', config.get('REDIS_PORT'));

  return config;
}

// Example 6: Configuration Validation
export function demonstrateValidation() {
  const config = ConfigServiceFactory.createAMQPConfig({
    url: 'amqp://localhost:5672',
    exchange: 'events',
    queue: 'my-service.events',
    routingKeys: ['user.created'],
  });

  // Valid configuration
  const validResult = config.validate({
    url: 'amqp://new-host:5672',
    exchange: 'new-exchange',
    queue: 'new-queue',
    routingKeys: ['task.created'],
  });

  console.log('Valid config validation:', validResult.success);

  // Invalid configuration
  const invalidResult = config.validate({
    url: 'invalid-url', // Invalid URL format
    exchange: '', // Empty exchange name
    queue: 'new-queue',
    routingKeys: [], // Empty routing keys array
  });

  console.log('Invalid config validation:', invalidResult.success);
  if (!invalidResult.success) {
    console.log(
      'Validation errors:',
      invalidResult.error?.issues.map((err) => err.message),
    );
  }
}

// Example 7: Error Handling
export function demonstrateErrorHandling() {
  try {
    // This will throw a validation error
    new ConfigService({
      schema: z.object({
        port: z.number().positive(),
      }),
      envOverrides: {
        port: -1, // Invalid negative port
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log('Caught validation error:', error.message);
      if (error.name === 'ConfigurationValidationError') {
        console.log(
          'Validation issues:',
          (error as unknown as { validationErrors: unknown }).validationErrors,
        );
      }
    }
  }
}

// Run all examples
if (require.main === module) {
  console.log('=== ConfigService Usage Examples ===\n');

  console.log('1. Basic Environment Configuration:');
  createBasicEnvironmentConfig();
  console.log();

  console.log('2. Custom Configuration:');
  createCustomConfig();
  console.log();

  console.log('3. AMQP Configuration:');
  createAMQPConfig();
  console.log();

  console.log('4. Redis Configuration:');
  createRedisConfig();
  console.log();

  console.log('5. Environment Variables with Prefix:');
  createConfigWithEnvPrefix();
  console.log();

  console.log('6. Configuration Validation:');
  demonstrateValidation();
  console.log();

  console.log('7. Error Handling:');
  demonstrateErrorHandling();
  console.log();

  console.log('=== All examples completed ===');
}
