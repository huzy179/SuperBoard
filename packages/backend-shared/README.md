# @superboard/backend-shared

Shared backend infrastructure components for SuperBoard microservices. This library provides common functionality for AMQP consumers, health checks, configuration management, event processing, metrics, and more across both TypeScript/NestJS and Python services.

## Features

- **AMQP Consumer Framework**: Base classes with connection management, reconnection logic, and dead letter queue handling
- **Health Check System**: Standardized health checks with configurable dependency monitoring
- **Configuration Management**: Type-safe configuration with validation and environment-specific loading
- **Event Processing Framework**: Base event handlers with correlation ID tracking and retry mechanisms
- **Metrics and Monitoring**: Prometheus-compatible metrics collection with standard and custom metrics
- **Service Bootstrap**: Utilities for consistent service initialization and graceful shutdown
- **Connection Pool Management**: Redis, Database, and other external service connection pooling
- **Error Handling**: Standardized error responses with classification and recovery strategies
- **Testing Framework**: Mock factories, test helpers, and property-based testing utilities

## Multi-Language Support

This library provides implementations in both TypeScript and Python to support the diverse technology stack of SuperBoard microservices:

- **TypeScript/NestJS**: Primary implementation for most microservices
- **Python**: Equivalent functionality for the AI Service and other Python-based services

## Installation

### TypeScript/Node.js

```bash
npm install @superboard/backend-shared
```

### Python

```bash
pip install superboard-backend-shared
```

## Quick Start

### TypeScript Example

```typescript
import { BaseAMQPConsumer, HealthCheckService, ConfigService } from '@superboard/backend-shared';

// AMQP Consumer
class MyConsumer extends BaseAMQPConsumer {
  getQueueName(): string {
    return 'my.queue';
  }

  getExchangeName(): string {
    return 'my.exchange';
  }

  getBindingKeys(): string[] {
    return ['my.routing.key'];
  }

  async processMessage(message: any, correlationId: string): Promise<void> {
    // Process your message here
    console.log('Processing message:', message);
  }
}

// Health Check
const healthService = new HealthCheckService();
healthService.registerIndicator('database', new DatabaseHealthIndicator(dbConfig));

// Configuration
const configService = new ConfigService(myConfigSchema);
const port = configService.get('PORT');
```

### Python Example

```python
from superboard_shared.amqp import BaseAMQPConsumer
from superboard_shared.health import HealthCheckService, DatabaseHealthIndicator
from superboard_shared.config import ConfigService

# AMQP Consumer
class MyConsumer(BaseAMQPConsumer):
    def get_queue_name(self) -> str:
        return 'my.queue'

    def get_exchange_name(self) -> str:
        return 'my.exchange'

    def get_binding_keys(self) -> list[str]:
        return ['my.routing.key']

    async def process_message(self, message: dict, correlation_id: str) -> None:
        # Process your message here
        print(f'Processing message: {message}')

# Health Check
health_service = HealthCheckService()
health_service.register_indicator('database', DatabaseHealthIndicator(db_config))

# Configuration
config_service = ConfigService(my_config_schema)
port = config_service.get('PORT')
```

## Architecture

The library is organized into the following modules:

```
@superboard/backend-shared/
├── amqp/                    # AMQP consumer framework
├── health/                  # Health check system
├── config/                  # Configuration management
├── events/                  # Event processing framework
├── metrics/                 # Metrics and monitoring
├── bootstrap/               # Service bootstrap utilities
├── connections/             # Connection pool management
├── errors/                  # Error handling utilities
└── testing/                 # Testing framework utilities
```

Each module provides both TypeScript and Python implementations with feature parity.

## Core Components

### AMQP Consumer Framework

Provides a base consumer class that handles:

- Connection management with automatic reconnection
- Dead letter queue routing for failed messages
- Metrics collection for message processing
- Correlation ID tracking throughout the pipeline

### Health Check System

Standardized health checks with:

- `/health` endpoint for basic service status
- `/ready` endpoint for dependency readiness
- Built-in indicators for common dependencies (Redis, Database, RabbitMQ, gRPC)
- Configurable timeouts and retry logic

### Configuration Management

Type-safe configuration with:

- Environment variable loading and validation
- Schema-based configuration with Zod (TypeScript) / Pydantic (Python)
- Environment-specific configuration files
- Default value handling

### Event Processing Framework

Event handling with:

- Base event handler interface
- Correlation ID tracking across event processing
- Automatic retry mechanisms with exponential backoff
- Event type filtering and routing

### Metrics and Monitoring

Prometheus-compatible metrics with:

- Standard metrics (request count, duration, errors)
- Custom business metrics support
- Automatic metrics collection for AMQP and HTTP operations
- Configurable metric labels and prefixes

## Development

### Prerequisites

- Node.js 20.11.0 or higher
- Python 3.9 or higher
- Docker (for integration tests)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd packages/backend-shared

# Install TypeScript dependencies
npm install

# Install Python dependencies
cd python
pip install -e .[dev]
```

### Running Tests

```bash
# TypeScript tests
npm run test
npm run test:watch
npm run test:coverage

# Python tests
cd python
pytest
pytest --cov=superboard_shared

# Integration tests (requires Docker services)
npm run test:integration
```

### Building

```bash
# Build TypeScript
npm run build

# Build Python
npm run build:python
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test` and `pytest`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- **TypeScript**: Uses ESLint and Prettier for code formatting
- **Python**: Uses Black for code formatting and Flake8 for linting
- **Testing**: Property-based tests using fast-check (TypeScript) and Hypothesis (Python)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support, please open an issue in the repository or contact the SuperBoard development team.
