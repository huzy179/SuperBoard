# Design Document: Backend Refactoring

## Overview

This design outlines the refactoring of the SuperBoard backend system, which currently consists of 6 microservices (API, AI Service, Automation, Collaboration, Notification, Search) with significant code duplication and inconsistent patterns. The refactoring will create a shared library (`@superboard/backend-shared`) that provides common functionality, standardizes patterns, and improves maintainability.

### Current State Analysis

The existing backend has several issues:

- **Code Duplication**: Multiple AMQP consumer implementations with similar patterns
- **Inconsistent Health Checks**: Different health check implementations across services
- **Configuration Fragmentation**: Each service manages configuration differently
- **Mixed Technologies**: Python (AI Service) and TypeScript/NestJS (other services)
- **Inconsistent Error Handling**: Different error response formats and logging patterns

### Goals

1. **Reduce Code Duplication**: Create reusable components for common functionality
2. **Standardize Patterns**: Establish consistent approaches across all services
3. **Improve Maintainability**: Centralize common logic in a shared library
4. **Enhance Observability**: Standardize logging, metrics, and monitoring
5. **Simplify Development**: Provide utilities that reduce boilerplate code

## Architecture

### Shared Library Structure

The `@superboard/backend-shared` library will be organized as follows:

```
packages/backend-shared/
├── src/
│   ├── amqp/                    # AMQP consumer framework
│   │   ├── base-consumer.ts
│   │   ├── connection-manager.ts
│   │   └── types.ts
│   ├── health/                  # Health check system
│   │   ├── health-check.service.ts
│   │   ├── indicators/
│   │   └── types.ts
│   ├── config/                  # Configuration management
│   │   ├── config.service.ts
│   │   ├── validators.ts
│   │   └── types.ts
│   ├── events/                  # Event processing framework
│   │   ├── base-handler.ts
│   │   ├── event-bus.ts
│   │   └── types.ts
│   ├── metrics/                 # Metrics and monitoring
│   │   ├── metrics.service.ts
│   │   ├── collectors/
│   │   └── types.ts
│   ├── bootstrap/               # Service bootstrap utilities
│   │   ├── nest-bootstrap.ts
│   │   ├── python-bootstrap.py
│   │   └── types.ts
│   ├── connections/             # Connection pool management
│   │   ├── redis-pool.ts
│   │   ├── database-pool.ts
│   │   └── types.ts
│   ├── errors/                  # Error handling utilities
│   │   ├── error-handler.ts
│   │   ├── error-types.ts
│   │   └── filters/
│   ├── testing/                 # Testing framework utilities
│   │   ├── test-helpers.ts
│   │   ├── mock-factories.ts
│   │   └── property-test-utils.ts
│   └── index.ts
├── python/                      # Python-specific implementations
│   ├── superboard_shared/
│   │   ├── amqp/
│   │   ├── health/
│   │   ├── config/
│   │   └── __init__.py
│   └── setup.py
├── package.json
└── README.md
```

### Multi-Language Support

Since the AI Service is implemented in Python while other services use TypeScript/NestJS, the shared library will provide implementations in both languages:

- **TypeScript**: Primary implementation for NestJS services
- **Python**: Equivalent implementations for the AI Service

## Components and Interfaces

### 1. AMQP Consumer Framework

#### Base Consumer Class (TypeScript)

```typescript
export abstract class BaseAMQPConsumer {
  protected connection: Connection | null = null;
  protected channel: Channel | null = null;
  protected running = false;

  constructor(
    protected config: AMQPConfig,
    protected logger: Logger,
    protected metrics: MetricsService,
  ) {}

  abstract getQueueName(): string;
  abstract getExchangeName(): string;
  abstract getBindingKeys(): string[];
  abstract processMessage(message: any, correlationId: string): Promise<void>;

  async start(): Promise<void>;
  async stop(): Promise<void>;
  protected async handleMessage(message: IncomingMessage): Promise<void>;
  protected async reconnect(): Promise<void>;
}
```

#### Connection Manager

```typescript
export class AMQPConnectionManager {
  private connections = new Map<string, Connection>();

  async getConnection(config: AMQPConfig): Promise<Connection>;
  async closeAll(): Promise<void>;
  private async createConnection(config: AMQPConfig): Promise<Connection>;
}
```

### 2. Health Check System

#### Health Check Service

```typescript
export class HealthCheckService {
  private indicators = new Map<string, HealthIndicator>();

  registerIndicator(name: string, indicator: HealthIndicator): void;
  async checkHealth(): Promise<HealthResult>;
  async checkReadiness(): Promise<ReadinessResult>;
}

export interface HealthIndicator {
  name: string;
  check(): Promise<HealthStatus>;
}
```

#### Built-in Indicators

- `DatabaseHealthIndicator`
- `RedisHealthIndicator`
- `RabbitMQHealthIndicator`
- `GRPCHealthIndicator`

### 3. Configuration Management

#### Configuration Service

```typescript
export class ConfigService<T = any> {
  private config: T;

  constructor(schema: z.ZodSchema<T>, envOverrides?: Partial<T>) {
    this.config = this.loadAndValidate(schema, envOverrides);
  }

  get<K extends keyof T>(key: K): T[K];
  getRequired<K extends keyof T>(key: K): NonNullable<T[K]>;
  private loadAndValidate<T>(schema: z.ZodSchema<T>, overrides?: Partial<T>): T;
}
```

### 4. Event Processing Framework

#### Base Event Handler

```typescript
export abstract class BaseEventHandler<T = any> {
  abstract getEventType(): string;
  abstract handle(payload: T, context: EventContext): Promise<void>;

  protected async withRetry<R>(operation: () => Promise<R>, options: RetryOptions = {}): Promise<R>;
}

export interface EventContext {
  correlationId: string;
  timestamp: Date;
  retryCount: number;
  metadata: Record<string, any>;
}
```

### 5. Metrics and Monitoring

#### Metrics Service

```typescript
export class MetricsService {
  private registry: Registry;
  private collectors = new Map<string, Collector>();

  constructor(config: MetricsConfig) {
    this.registry = new Registry();
    this.setupDefaultMetrics();
  }

  createCounter(name: string, help: string, labels?: string[]): Counter;
  createHistogram(name: string, help: string, buckets?: number[]): Histogram;
  createGauge(name: string, help: string, labels?: string[]): Gauge;

  async getMetrics(): Promise<string>;
  recordEventProcessed(eventType: string, duration: number): void;
  recordEventFailed(eventType: string, error: string): void;
}
```

### 6. Service Bootstrap

#### NestJS Bootstrap Utility

```typescript
export class NestBootstrap {
  static async create(AppModule: any, config: BootstrapConfig): Promise<INestApplication> {
    const app = await NestFactory.create(AppModule, {
      logger: config.logger || new CustomLogger(),
    });

    // Apply common middleware
    app.use(correlationIdMiddleware);
    app.use(requestLoggingMiddleware);

    // Setup CORS
    app.enableCors(config.cors);

    // Setup global prefix
    app.setGlobalPrefix(config.globalPrefix || 'api/v1');

    // Setup global filters
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Setup graceful shutdown
    this.setupGracefulShutdown(app);

    return app;
  }
}
```

### 7. Connection Pool Management

#### Redis Pool Manager

```typescript
export class RedisPoolManager {
  private pools = new Map<string, Redis>();

  async getConnection(config: RedisConfig): Promise<Redis>;
  async closeAll(): Promise<void>;
  async healthCheck(connectionName: string): Promise<boolean>;
}
```

#### Database Pool Manager

```typescript
export class DatabasePoolManager {
  private pools = new Map<string, Pool>();

  async getPool(config: DatabaseConfig): Promise<Pool>;
  async closeAll(): Promise<void>;
  async healthCheck(poolName: string): Promise<boolean>;
}
```

## Data Models

### Configuration Models

```typescript
export interface AMQPConfig {
  url: string;
  exchange: string;
  queue: string;
  routingKeys: string[];
  prefetchCount?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

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
  config: any;
  timeout?: number;
}
```

### Event Models

```typescript
export interface DomainEvent {
  eventType: string;
  correlationId: string;
  timestamp: string;
  payload: any;
  metadata?: Record<string, any>;
}

export interface EventContext {
  correlationId: string;
  timestamp: Date;
  retryCount: number;
  metadata: Record<string, any>;
}
```

### Health Models

```typescript
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
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Before writing correctness properties, I need to analyze the acceptance criteria to determine which are suitable for property-based testing.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Connection Management Properties**: Properties for AMQP reconnection (1.2, 1.6) and connection pool reconnection (7.5) can be combined into a comprehensive connection resilience property.

**Configuration Properties**: Properties for configuration validation (3.3, 3.5) and consistency (3.7, 7.7) can be consolidated into configuration management properties.

**Metrics Properties**: Properties for metrics collection (1.3, 4.6, 5.2) can be combined into comprehensive metrics collection properties.

**Error Handling Properties**: Properties for error responses (9.2, 9.5) and DLQ handling (1.4, 4.5) can be consolidated.

### Property 1: AMQP Connection Resilience

_For any_ AMQP configuration and connection failure scenario, the base consumer SHALL automatically reconnect with exponential backoff and maintain connection state consistency.

**Validates: Requirements 1.2, 1.6, 7.5**

### Property 2: Configuration Round-trip Consistency

_For any_ valid configuration object, serializing and deserializing the configuration SHALL produce an equivalent configuration with all required fields preserved.

**Validates: Requirements 1.7, 3.6**

### Property 3: Health Check Response Format Consistency

_For any_ health check configuration and dependency state, the health check response SHALL conform to the standardized format with consistent field structure and status codes.

**Validates: Requirements 2.1, 2.4, 2.6**

### Property 4: Configuration Validation Completeness

_For any_ configuration schema and input data, the configuration module SHALL validate all required fields and provide descriptive errors for any validation failures.

**Validates: Requirements 3.3, 3.5, 6.5**

### Property 5: Event Processing Idempotency

_For any_ domain event, processing the same event multiple times SHALL produce the same result without side effects, maintaining system state consistency.

**Validates: Requirements 4.7**

### Property 6: Event Handler Correlation Tracking

_For any_ event processing operation, the correlation ID SHALL be preserved and tracked throughout the entire processing pipeline including retries and error handling.

**Validates: Requirements 4.2, 9.3**

### Property 7: Metrics Collection Completeness

_For any_ service operation (message processing, HTTP requests, event handling), the metrics service SHALL collect standard metrics (count, duration, errors) with consistent labeling.

**Validates: Requirements 1.3, 4.6, 5.2, 5.7**

### Property 8: Dead Letter Queue Routing Consistency

_For any_ failed message or event processing, the system SHALL route failures to the appropriate dead letter queue with complete failure context and metadata.

**Validates: Requirements 1.4, 4.5**

### Property 9: Connection Pool Management Consistency

_For any_ external connection type (Redis, Database, AMQP), the connection manager SHALL provide consistent pooling behavior with configurable parameters and health checking.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6**

### Property 10: Error Response Standardization

_For any_ error condition across all services, the error handler SHALL produce standardized error responses with appropriate HTTP status codes and consistent error classification.

**Validates: Requirements 9.2, 9.4, 9.5, 9.7**

### Property 11: Bootstrap Configuration Consistency

_For any_ service bootstrap configuration, the bootstrap utility SHALL apply consistent logging format, graceful shutdown handling, and dependency validation across all services.

**Validates: Requirements 6.3, 6.4, 6.7**

### Property 12: Test Framework Mock Generation

_For any_ common dependency type, the test framework SHALL generate appropriate mocks with consistent behavior and provide reliable test data builders.

**Validates: Requirements 10.2, 10.5, 10.6**

## Error Handling

### Error Classification System

The shared library will implement a comprehensive error classification system:

```typescript
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
```

### Error Response Format

All services will use a standardized error response format:

```typescript
export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    type: ErrorType;
    severity: ErrorSeverity;
    correlationId: string;
    timestamp: string;
    details?: any;
    stack?: string; // Only in development
  };
}
```

### Error Recovery Strategies

The error handling system will implement several recovery strategies:

1. **Retry with Exponential Backoff**: For transient failures
2. **Circuit Breaker**: For external service failures
3. **Fallback**: For non-critical operations
4. **Dead Letter Queue**: For unrecoverable message processing failures

### Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);
    const statusCode = this.getStatusCode(exception);

    this.logError(exception, request, errorResponse);

    response.status(statusCode).json(errorResponse);
  }
}
```

## Testing Strategy

### Dual Testing Approach

The backend refactoring will implement a comprehensive testing strategy combining:

**Unit Tests**:

- Specific examples and edge cases
- Integration points between components
- Error conditions and boundary cases
- Mock-based testing for external dependencies

**Property-Based Tests**:

- Universal properties across all inputs (minimum 100 iterations per test)
- Configuration validation and serialization
- Connection management and resilience
- Event processing consistency
- Error handling standardization

### Property-Based Testing Configuration

Each property test will be configured with:

- **Minimum 100 iterations** to ensure comprehensive input coverage
- **Custom generators** for domain-specific data types (AMQP configs, events, etc.)
- **Shrinking strategies** to find minimal failing examples
- **Test tags** referencing design document properties

Example test tag format:

```typescript
// Feature: backend-refactoring, Property 1: AMQP Connection Resilience
```

### Testing Framework Components

The shared testing library will provide:

1. **Mock Factories**: Pre-configured mocks for common dependencies
2. **Test Data Builders**: Fluent builders for complex test data
3. **Integration Test Helpers**: Utilities for setting up test environments
4. **Property Test Utilities**: Custom generators and strategies
5. **Assertion Libraries**: Domain-specific assertions

### Test Organization Standards

All services will follow consistent test organization:

```
src/
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── property/
├── test-utils/
│   ├── builders/
│   ├── mocks/
│   └── fixtures/
```

### Mock Factory Examples

```typescript
export class MockFactories {
  static createAMQPConfig(overrides?: Partial<AMQPConfig>): AMQPConfig {
    return {
      url: 'amqp://localhost:5672',
      exchange: 'test.exchange',
      queue: 'test.queue',
      routingKeys: ['test.key'],
      prefetchCount: 10,
      ...overrides,
    };
  }

  static createDomainEvent(overrides?: Partial<DomainEvent>): DomainEvent {
    return {
      eventType: 'test.event',
      correlationId: uuid(),
      timestamp: new Date().toISOString(),
      payload: {},
      ...overrides,
    };
  }
}
```

This testing strategy ensures both concrete correctness through unit tests and general correctness through property-based testing, providing comprehensive coverage for the refactored backend system.

## Implementation Plan

### Phase 1: Core Infrastructure (Weeks 1-2)

1. **Setup Shared Library Package**
   - Create `@superboard/backend-shared` package structure
   - Setup TypeScript and Python build configurations
   - Establish CI/CD pipeline for the shared library

2. **Configuration Management**
   - Implement `ConfigService` with Zod validation
   - Create environment-specific configuration loaders
   - Add typed configuration interfaces

3. **Connection Management**
   - Implement `AMQPConnectionManager`
   - Create `RedisPoolManager` and `DatabasePoolManager`
   - Add health checking for all connection types

### Phase 2: Event Processing Framework (Weeks 3-4)

1. **AMQP Consumer Framework**
   - Implement `BaseAMQPConsumer` class
   - Add reconnection logic with exponential backoff
   - Create dead letter queue handling

2. **Event Processing**
   - Implement `BaseEventHandler` interface
   - Add correlation ID tracking
   - Create retry mechanisms and idempotency handling

3. **Python Implementation**
   - Port AMQP consumer framework to Python
   - Ensure feature parity with TypeScript version

### Phase 3: Observability and Health (Weeks 5-6)

1. **Health Check System**
   - Implement `HealthCheckService`
   - Create built-in health indicators
   - Standardize `/health` and `/ready` endpoints

2. **Metrics and Monitoring**
   - Implement `MetricsService` with Prometheus format
   - Add standard metrics collection
   - Create custom metrics support

3. **Error Handling**
   - Implement global exception filters
   - Create standardized error response format
   - Add error classification and recovery strategies

### Phase 4: Service Bootstrap and Testing (Weeks 7-8)

1. **Bootstrap Utilities**
   - Implement `NestBootstrap` utility
   - Add graceful shutdown handling
   - Create Python bootstrap equivalent

2. **Testing Framework**
   - Implement mock factories and test builders
   - Create property-based testing utilities
   - Add integration test helpers

### Phase 5: Service Migration (Weeks 9-12)

1. **API Service Migration**
   - Replace existing health checks with shared implementation
   - Migrate to shared configuration management
   - Update error handling to use shared utilities

2. **Other NestJS Services Migration**
   - Migrate Automation, Collaboration, Notification, Search services
   - Ensure consistent patterns across all services
   - Update directory structures

3. **AI Service Migration**
   - Replace Python AMQP consumer with shared implementation
   - Migrate configuration and health checks
   - Ensure feature parity with TypeScript services

### Phase 6: Directory Restructure and Cleanup (Weeks 13-14)

1. **Directory Standardization**
   - Implement consistent directory structure across services
   - Standardize file naming conventions
   - Create common folders for shared utilities

2. **Code Cleanup**
   - Remove duplicated code
   - Update imports to use shared library
   - Ensure all services follow established patterns

3. **Documentation and Training**
   - Create comprehensive documentation
   - Provide migration guides
   - Conduct team training sessions

## Migration Strategy

### Backward Compatibility

During migration, the shared library will maintain backward compatibility:

1. **Gradual Migration**: Services can be migrated one at a time
2. **Feature Flags**: New functionality can be enabled incrementally
3. **Deprecation Warnings**: Old patterns will show warnings before removal

### Risk Mitigation

1. **Comprehensive Testing**: Each migration step will be thoroughly tested
2. **Rollback Plans**: Each service migration will have a rollback strategy
3. **Monitoring**: Enhanced monitoring during migration period
4. **Staged Deployment**: Deploy to staging environment first

### Success Metrics

1. **Code Reduction**: Measure reduction in duplicated code
2. **Consistency**: Verify consistent patterns across services
3. **Performance**: Ensure no performance degradation
4. **Reliability**: Monitor error rates and system stability

## Deployment Considerations

### Package Management

The shared library will be published as:

- **NPM Package**: `@superboard/backend-shared` for TypeScript/NestJS services
- **Python Package**: `superboard-shared` for Python services

### Versioning Strategy

- **Semantic Versioning**: Follow semver for all releases
- **Breaking Changes**: Major version bumps for breaking changes
- **Feature Additions**: Minor version bumps for new features
- **Bug Fixes**: Patch version bumps for fixes

### CI/CD Integration

1. **Automated Testing**: Run full test suite on every commit
2. **Automated Publishing**: Publish packages on version tags
3. **Service Updates**: Automated dependency updates for services
4. **Integration Testing**: Cross-service integration tests

## Monitoring and Observability

### Metrics Collection

The shared library will collect standardized metrics:

1. **AMQP Metrics**:
   - Message processing rate
   - Connection health
   - Dead letter queue depth
   - Processing latency

2. **HTTP Metrics**:
   - Request rate and latency
   - Error rates by endpoint
   - Response size distribution

3. **System Metrics**:
   - Memory and CPU usage
   - Connection pool utilization
   - Health check status

### Logging Standards

All services will use consistent logging:

1. **Structured Logging**: JSON format with consistent fields
2. **Correlation IDs**: Track requests across services
3. **Log Levels**: Standardized log levels and usage
4. **Sensitive Data**: Automatic redaction of sensitive information

### Alerting

Standardized alerting rules:

1. **Health Check Failures**: Alert on service unavailability
2. **High Error Rates**: Alert on elevated error rates
3. **Performance Degradation**: Alert on latency increases
4. **Resource Exhaustion**: Alert on resource limits

This comprehensive design provides a solid foundation for refactoring the SuperBoard backend system, reducing code duplication, improving maintainability, and establishing consistent patterns across all services.
