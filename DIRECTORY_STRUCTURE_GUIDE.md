# Backend Directory Structure Standardization Guide

## Overview

This guide documents the standardized directory structure and file naming conventions for all backend services in the SuperBoard system. This standardization ensures consistency across all services and improves code maintainability.

## Standardized Directory Structure

All backend services follow this consistent structure:

```
src/
├── controllers/              # HTTP request handlers
│   ├── *.controller.ts      # Controller files
│   └── dto/                 # Data Transfer Objects
├── services/                # Business logic layer
│   ├── *.service.ts         # Service implementations
│   └── interfaces/          # Service interfaces
├── modules/                 # NestJS modules
│   ├── *.module.ts          # Module definitions
│   └── */                   # Feature-specific modules
├── common/                  # Shared utilities and helpers
│   ├── decorators/          # Custom decorators
│   ├── filters/             # Exception filters
│   ├── guards/              # Authentication/authorization guards
│   ├── interceptors/        # Request/response interceptors
│   ├── middleware/          # Custom middleware
│   ├── pipes/               # Validation pipes
│   ├── utils/               # Utility functions
│   └── constants.ts         # Application constants
├── config/                  # Configuration management
│   ├── env.ts               # Environment variable definitions
│   └── shared-config.module.ts  # Configuration module
├── __tests__/               # Test files (organized by type)
│   ├── unit/                # Unit tests
│   │   └── *.test.ts        # Unit test files
│   ├── integration/         # Integration tests
│   │   └── *.integration.test.ts  # Integration test files
│   └── property/            # Property-based tests
│       └── *.property.test.ts    # Property test files
├── test-utils/              # Testing utilities and helpers
│   ├── builders/            # Test data builders
│   │   └── *.builder.ts     # Builder implementations
│   ├── mocks/               # Mock factories
│   │   └── *.mock.ts        # Mock implementations
│   └── fixtures/            # Test fixtures and data
│       └── *.fixture.ts     # Fixture definitions
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point
```

## File Naming Conventions

### Controllers

- **Pattern**: `{feature}.controller.ts`
- **Example**: `user.controller.ts`, `project.controller.ts`
- **Purpose**: HTTP request handlers for a specific feature

### Services

- **Pattern**: `{feature}.service.ts`
- **Example**: `user.service.ts`, `project.service.ts`
- **Purpose**: Business logic implementation for a feature

### Modules

- **Pattern**: `{feature}.module.ts`
- **Example**: `user.module.ts`, `project.module.ts`
- **Purpose**: NestJS module definition that groups related components

### DTOs (Data Transfer Objects)

- **Pattern**: `{feature}.dto.ts` or `create-{feature}.dto.ts`, `update-{feature}.dto.ts`
- **Example**: `create-user.dto.ts`, `update-project.dto.ts`
- **Purpose**: Define request/response data structures

### Decorators

- **Pattern**: `{name}.decorator.ts`
- **Example**: `auth.decorator.ts`, `validate.decorator.ts`
- **Purpose**: Custom NestJS decorators

### Guards

- **Pattern**: `{name}.guard.ts`
- **Example**: `jwt.guard.ts`, `role.guard.ts`
- **Purpose**: Authentication and authorization guards

### Interceptors

- **Pattern**: `{name}.interceptor.ts`
- **Example**: `logging.interceptor.ts`, `transform.interceptor.ts`
- **Purpose**: Request/response transformation and logging

### Filters

- **Pattern**: `{name}.filter.ts`
- **Example**: `http-exception.filter.ts`, `validation.filter.ts`
- **Purpose**: Exception handling and error responses

### Middleware

- **Pattern**: `{name}.middleware.ts`
- **Example**: `request-context.middleware.ts`, `logging.middleware.ts`
- **Purpose**: Request processing middleware

### Pipes

- **Pattern**: `{name}.pipe.ts`
- **Example**: `validation.pipe.ts`, `parse-int.pipe.ts`
- **Purpose**: Data validation and transformation

### Utilities

- **Pattern**: `{name}.util.ts` or `{name}.helper.ts`
- **Example**: `date.util.ts`, `string.helper.ts`
- **Purpose**: Reusable utility functions

### Test Files

- **Unit Tests**: `{feature}.test.ts` or `{feature}.unit.test.ts`
  - Example: `user.service.test.ts`
  - Location: `__tests__/unit/`
- **Integration Tests**: `{feature}.integration.test.ts`
  - Example: `user.controller.integration.test.ts`
  - Location: `__tests__/integration/`
- **Property Tests**: `{feature}.property.test.ts`
  - Example: `configuration.property.test.ts`
  - Location: `__tests__/property/`

### Test Utilities

- **Builders**: `{entity}.builder.ts`
  - Example: `user.builder.ts`, `project.builder.ts`
  - Location: `test-utils/builders/`
- **Mocks**: `{service}.mock.ts`
  - Example: `user.service.mock.ts`, `database.mock.ts`
  - Location: `test-utils/mocks/`
- **Fixtures**: `{entity}.fixture.ts`
  - Example: `user.fixture.ts`, `project.fixture.ts`
  - Location: `test-utils/fixtures/`

## Separation of Concerns

### Controllers Layer

- Handles HTTP requests and responses
- Validates input using DTOs
- Delegates business logic to services
- Returns appropriate HTTP status codes

### Services Layer

- Implements business logic
- Handles data validation and transformation
- Manages interactions with repositories and external services
- Throws domain-specific exceptions

### Modules Layer

- Groups related controllers, services, and providers
- Manages dependency injection
- Exports public interfaces
- Handles feature-specific configuration

### Common Layer

- Provides cross-cutting concerns (logging, authentication, error handling)
- Implements shared utilities and helpers
- Defines application-wide constants
- Provides reusable decorators, guards, and interceptors

### Config Layer

- Manages environment variables
- Provides typed configuration objects
- Validates configuration on startup
- Handles environment-specific settings

## Layer Dependencies

The dependency flow should follow this pattern:

```
Controllers → Services → Repositories/External Services
     ↓
  Common (Decorators, Guards, Interceptors, Filters)
     ↓
  Config (Environment variables, typed configuration)
```

**Key Rules:**

- Controllers should NOT contain business logic
- Services should NOT directly handle HTTP requests
- Common utilities should be independent of business logic
- Config should be loaded once at startup
- No circular dependencies between layers

## Test Organization

### Unit Tests

- Test individual functions and classes in isolation
- Use mocks for external dependencies
- Located in `__tests__/unit/`
- File naming: `{feature}.test.ts`

### Integration Tests

- Test interactions between multiple components
- Use real or semi-real dependencies
- Located in `__tests__/integration/`
- File naming: `{feature}.integration.test.ts`

### Property-Based Tests

- Test universal properties across all inputs
- Minimum 100 iterations per test
- Located in `__tests__/property/`
- File naming: `{feature}.property.test.ts`

## Test Utilities

### Builders

- Fluent API for creating test data
- Located in `test-utils/builders/`
- Example:
  ```typescript
  new UserBuilder().withName('John').withEmail('john@example.com').build();
  ```

### Mocks

- Pre-configured mock implementations
- Located in `test-utils/mocks/`
- Example:
  ```typescript
  const mockUserService = createMockUserService();
  ```

### Fixtures

- Static test data
- Located in `test-utils/fixtures/`
- Example:
  ```typescript
  const testUser = userFixture.validUser;
  ```

## Migration Guide

### For Existing Services

1. **Create new directory structure** - Create all required directories
2. **Move existing files** - Reorganize files according to new structure
3. **Update imports** - Update all import paths to reflect new structure
4. **Rename files** - Apply naming conventions to all files
5. **Organize tests** - Move tests to appropriate `__tests__` subdirectories
6. **Create test utilities** - Extract common test code into builders/mocks/fixtures

### For New Services

1. **Create directory structure** - Use the standardized structure from the start
2. **Follow naming conventions** - Apply naming conventions to all new files
3. **Organize tests** - Place tests in appropriate `__tests__` subdirectories
4. **Use test utilities** - Leverage builders, mocks, and fixtures for testing

## Benefits

1. **Consistency** - All services follow the same structure
2. **Maintainability** - Clear organization makes code easier to find and modify
3. **Scalability** - New developers can quickly understand the codebase
4. **Testability** - Organized test structure encourages comprehensive testing
5. **Reusability** - Common utilities are easily discoverable and reusable

## Examples

### Example 1: User Module Structure

```
src/
├── controllers/
│   └── user.controller.ts
├── services/
│   └── user.service.ts
├── modules/
│   └── user.module.ts
├── common/
│   └── decorators/
│       └── auth.decorator.ts
└── __tests__/
    ├── unit/
    │   ├── user.service.test.ts
    │   └── user.controller.test.ts
    ├── integration/
    │   └── user.controller.integration.test.ts
    └── property/
        └── user.service.property.test.ts
```

### Example 2: Test Utilities Structure

```
test-utils/
├── builders/
│   └── user.builder.ts
├── mocks/
│   └── user.service.mock.ts
└── fixtures/
    └── user.fixture.ts
```

## Enforcement

- Code reviews should verify adherence to this structure
- Linting rules can be configured to enforce naming conventions
- Documentation should be updated when structure changes
- Team training should cover the standardized structure

## Questions and Updates

If you have questions about the directory structure or need to propose changes, please:

1. Document the issue or proposal
2. Discuss with the team
3. Update this guide if changes are approved
4. Communicate changes to all team members
