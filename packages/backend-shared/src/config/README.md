# Configuration Management Module

This module provides a comprehensive configuration management system with Zod validation, environment variable support, file-based configuration loading, and type safety for all SuperBoard microservices.

## Features

- **Type-Safe Configuration**: Generic ConfigService class with full TypeScript support
- **Zod Validation**: Comprehensive validation schemas for all configuration types
- **Environment Variable Loading**: Automatic parsing and type conversion
- **Environment Variable Prefixes**: Support for prefixed environment variables
- **File-Based Configuration**: Load configuration from JSON and YAML files
- **Environment-Specific Overrides**: Support for environment-specific configuration files (e.g., config.development.json)
- **Default Values**: Sensible defaults for optional configuration fields
- **Factory Methods**: Pre-configured factory methods for different service types
- **Error Handling**: Detailed validation error messages with field-level information

## Core Components

### ConfigService<T>

The main configuration service class that provides:

- `get<K>(key: K): T[K]` - Get configuration value by key
- `getRequired<K>(key: K): NonNullable<T[K]>` - Get required value (throws if missing)
- `getAll(): T` - Get entire configuration object
- `has<K>(key: K): boolean` - Check if configuration key exists
- `validate(config: Partial<T>)` - Validate configuration against schema

### ConfigServiceFactory

Factory class with pre-configured methods for different service types:

- `createAPIServiceConfig()` - API service configuration
- `createAIServiceConfig()` - AI service configuration
- `createAutomationServiceConfig()` - Automation service configuration
- `createCollaborationServiceConfig()` - Collaboration service configuration
- `createNotificationServiceConfig()` - Notification service configuration
- `createSearchServiceConfig()` - Search service configuration
- `createAMQPConfig()` - AMQP configuration
- `createRedisConfig()` - Redis configuration
- `createDatabaseConfig()` - Database configuration
- `createHealthConfig()` - Health check configuration
- `createMetricsConfig()` - Metrics configuration
- `createBootstrapConfig()` - Bootstrap configuration

### ConfigFileLoader

Loads configuration from JSON and YAML files with environment-specific overrides:

- Discovers configuration files by pattern (e.g., `config.json`, `config.development.json`)
- Supports multiple file formats: JSON, YAML, YML
- Merges base configuration with environment-specific overrides
- Applies default values for optional fields
- Validates configuration against Zod schemas
- Provides detailed error reporting

### File Loading Methods

The ConfigServiceFactory provides convenience methods for loading configuration from files:

- `loadAPIServiceConfigFromFiles()` - Load API service configuration from files
- `loadAIServiceConfigFromFiles()` - Load AI service configuration from files
- `loadAutomationServiceConfigFromFiles()` - Load Automation service configuration from files
- `loadCollaborationServiceConfigFromFiles()` - Load Collaboration service configuration from files
- `loadNotificationServiceConfigFromFiles()` - Load Notification service configuration from files
- `loadSearchServiceConfigFromFiles()` - Load Search service configuration from files
- `loadAMQPConfigFromFiles()` - Load AMQP configuration from files
- `loadRedisConfigFromFiles()` - Load Redis configuration from files
- `loadDatabaseConfigFromFiles()` - Load Database configuration from files
- `loadHealthConfigFromFiles()` - Load Health configuration from files
- `loadMetricsConfigFromFiles()` - Load Metrics configuration from files
- `loadBootstrapConfigFromFiles()` - Load Bootstrap configuration from files

### Validation Schemas

Comprehensive Zod schemas for all configuration types:

- `EnvironmentConfigSchema` - Basic environment configuration
- `AMQPConfigSchema` - RabbitMQ/AMQP configuration
- `RedisConfigSchema` - Redis configuration
- `DatabaseConfigSchema` - Database configuration
- `HealthConfigSchema` - Health check configuration
- `MetricsConfigSchema` - Metrics configuration
- `BootstrapConfigSchema` - Service bootstrap configuration
- Service-specific schemas for all 6 microservices

## Usage Examples

### Basic Environment Configuration

```typescript
import { createEnvironmentConfigService } from '@superboard/backend-shared/config';

const config = createEnvironmentConfigService({
  NODE_ENV: 'production',
  PORT: 8080,
});

console.log(config.get('NODE_ENV')); // 'production'
console.log(config.get('PORT')); // 8080
console.log(config.get('LOG_LEVEL')); // 'info' (default)
```

### Custom Configuration with Validation

```typescript
import { z } from 'zod';
import { ConfigService } from '@superboard/backend-shared/config';

const schema = z.object({
  serviceName: z.string().min(1),
  port: z.number().positive(),
  features: z.object({
    auth: z.boolean().default(true),
    metrics: z.boolean().default(false),
  }),
});

const config = new ConfigService({
  schema,
  envOverrides: {
    serviceName: 'my-service',
    port: 3000,
    features: { auth: true, metrics: true },
  },
});
```

### AMQP Configuration

```typescript
import { ConfigServiceFactory } from '@superboard/backend-shared/config';

const amqpConfig = ConfigServiceFactory.createAMQPConfig({
  url: 'amqp://localhost:5672',
  exchange: 'events',
  queue: 'my-service.events',
  routingKeys: ['user.created', 'user.updated'],
});

console.log(amqpConfig.get('prefetchCount')); // 10 (default)
```

### Environment Variables with Prefix

```typescript
// Environment variables:
// MYAPP_DATABASE_HOST=localhost
// MYAPP_DATABASE_PORT=5432

const config = new ConfigService({
  schema: z.object({
    DATABASE_HOST: z.string(),
    DATABASE_PORT: z.number(),
  }),
  envPrefix: 'MYAPP_',
});

console.log(config.get('DATABASE_HOST')); // 'localhost'
console.log(config.get('DATABASE_PORT')); // 5432
```

### Configuration Validation

```typescript
const config = ConfigServiceFactory.createRedisConfig({
  host: 'localhost',
  port: 6379,
});

// Validate new configuration
const result = config.validate({
  host: 'redis.example.com',
  port: 6380,
});

if (result.success) {
  console.log('Valid configuration');
} else {
  console.log('Validation errors:', result.error?.issues);
}
```

### Loading Configuration from Files

The configuration module supports loading configuration from JSON and YAML files with environment-specific overrides.

#### Basic File Loading

```typescript
import { ConfigService } from '@superboard/backend-shared/config';
import { AMQPConfigSchema } from '@superboard/backend-shared/config';

// Load configuration from files in the current directory
const config = await ConfigService.loadFromFiles(AMQPConfigSchema, {
  configDir: process.cwd(),
  environment: 'development',
});

console.log(config.get('url')); // From config.development.json or config.json
```

#### Using Factory Methods

```typescript
import { ConfigServiceFactory } from '@superboard/backend-shared/config';

// Load AMQP configuration from files
const amqpConfig = await ConfigServiceFactory.loadAMQPConfigFromFiles({
  configDir: './config',
  environment: 'production',
});

console.log(amqpConfig.get('url'));
console.log(amqpConfig.get('prefetchCount')); // Default value if not in file
```

#### File Discovery and Merging

The file loader automatically discovers and merges configuration files:

1. **Base configuration**: `config.json` or `config.yaml`
2. **Environment-specific**: `config.{environment}.json` or `config.{environment}.yaml`
3. **Default values**: Applied if `mergeDefaults` is enabled

Example file structure:

```
config/
├── config.json                 # Base configuration
├── config.development.json     # Development overrides
├── config.production.json      # Production overrides
└── config.staging.json         # Staging overrides
```

#### Configuration File Format

**JSON Format** (`config.json`):

```json
{
  "url": "amqp://localhost:5672",
  "exchange": "events",
  "queue": "my-service.events",
  "routingKeys": ["user.created", "user.updated"],
  "prefetchCount": 10
}
```

**YAML Format** (`config.yaml`):

```yaml
url: amqp://localhost:5672
exchange: events
queue: my-service.events
routingKeys:
  - user.created
  - user.updated
prefetchCount: 10
```

#### Environment-Specific Overrides

**Base Configuration** (`config.json`):

```json
{
  "url": "amqp://localhost:5672",
  "exchange": "events",
  "queue": "my-service.events",
  "routingKeys": ["user.created"]
}
```

**Development Override** (`config.development.json`):

```json
{
  "url": "amqp://dev.example.com:5672",
  "prefetchCount": 5
}
```

Result after merging:

```typescript
{
  "url": "amqp://dev.example.com:5672",  // Overridden
  "exchange": "events",                   // From base
  "queue": "my-service.events",           // From base
  "routingKeys": ["user.created"],        // From base
  "prefetchCount": 5                      // Overridden
}
```

#### Default Values

When `mergeDefaults` is enabled, the loader applies sensible defaults:

```typescript
const config = await ConfigService.loadFromFiles(AMQPConfigSchema, {
  configDir: './config',
  mergeDefaults: true,
});

// These values come from defaults if not in configuration files:
console.log(config.get('prefetchCount')); // 10
console.log(config.get('reconnectInterval')); // 5000
console.log(config.get('maxReconnectAttempts')); // 10
```

#### Validation During Loading

Configuration is automatically validated against the schema:

```typescript
try {
  const config = await ConfigService.loadFromFiles(AMQPConfigSchema, {
    configDir: './config',
    validate: true, // Enabled by default
  });
} catch (error) {
  console.error('Configuration validation failed:', error.message);
}
```

#### Convenience Functions

```typescript
import {
  loadConfig,
  loadEnvironmentConfig,
  loadConfigFromFile,
} from '@superboard/backend-shared/config';

// Load with default options
const result1 = await loadConfig(AMQPConfigSchema);

// Load for specific environment
const result2 = await loadEnvironmentConfig('production', AMQPConfigSchema, './config');

// Load from specific file
const result3 = await loadConfigFromFile('./config/custom.json', AMQPConfigSchema);
```

## Environment Variable Parsing

The ConfigService automatically parses environment variables to appropriate types:

- `'true'/'false'` → `boolean`
- `'123'` → `number`
- `'3.14'` → `number`
- `'{"key":"value"}'` → `object`
- `'[1,2,3]'` → `array`
- `'null'` → `null`
- Everything else → `string`

## Error Handling

The ConfigService provides detailed error information for validation failures:

```typescript
try {
  new ConfigService({
    schema: z.object({
      port: z.number().positive(),
    }),
    envOverrides: {
      port: -1, // Invalid
    },
  });
} catch (error) {
  if (error instanceof ConfigurationValidationError) {
    console.log('Validation failed:', error.message);
    console.log('Issues:', error.validationErrors);
  }
}
```

## Configuration Types

The module provides comprehensive TypeScript interfaces for all service configurations:

- `EnvironmentConfig` - Basic environment settings
- `APIServiceConfig` - Complete API service configuration
- `AIServiceConfig` - AI service configuration
- `AutomationServiceConfig` - Automation service configuration
- `CollaborationServiceConfig` - Collaboration service configuration
- `NotificationServiceConfig` - Notification service configuration
- `SearchServiceConfig` - Search service configuration

Each service configuration includes all necessary components:

- Database configuration
- Redis configuration
- AMQP configuration
- Health check configuration
- Metrics configuration
- Bootstrap configuration
- Service-specific settings

## Integration with Other Modules

This configuration module is designed to work seamlessly with other shared library components:

- **Health Checks**: Health configuration is used by the health check module
- **AMQP Consumers**: AMQP configuration is used by the AMQP consumer framework
- **Metrics**: Metrics configuration is used by the metrics collection system
- **Bootstrap**: Bootstrap configuration is used by the service bootstrap utilities

## Best Practices

1. **Use Factory Methods**: Prefer `ConfigServiceFactory` methods for standard configurations
2. **Environment Variables**: Use environment variables for deployment-specific settings
3. **Validation**: Always validate configuration at startup to catch issues early
4. **Default Values**: Provide sensible defaults for optional configuration
5. **Type Safety**: Leverage TypeScript types for compile-time safety
6. **Error Handling**: Handle configuration validation errors gracefully
7. **Documentation**: Document custom configuration schemas clearly

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **3.1**: Common configuration module with environment-specific config files
- **3.2**: Support for environment-specific configuration loading with file-based configuration
- **3.3**: Validation for required environment variables with descriptive errors
- **3.4**: Default values for optional configuration fields
- **3.5**: Descriptive error messages when configuration is invalid
- **3.6**: Support for typed configuration objects
- **3.7**: Consistent configuration loading across all services
- **6.5**: Dependency validation during startup

The ConfigService and ConfigFileLoader provide a robust, type-safe, and flexible configuration management system that standardizes configuration handling across all SuperBoard microservices. The file-based loading supports environment-specific overrides, default values, and comprehensive validation.
