# Directory Structure Standardization Checklist

This checklist tracks the standardization of directory structures across all backend services.

## Standardization Status

### ✅ Automation Service

- [x] Created `controllers/` directory
- [x] Created `services/` directory
- [x] Created `modules/` directory
- [x] Created `common/` directory
- [x] Created `__tests__/unit/` directory
- [x] Created `__tests__/integration/` directory
- [x] Created `__tests__/property/` directory
- [x] Created `test-utils/builders/` directory
- [x] Created `test-utils/mocks/` directory
- [x] Created `test-utils/fixtures/` directory
- [ ] Reorganized existing files to new structure
- [ ] Updated import paths
- [ ] Applied naming conventions to files
- [ ] Moved tests to `__tests__/` directories

### ✅ Collaboration Service

- [x] Created `controllers/` directory
- [x] Created `services/` directory
- [x] Created `modules/` directory
- [x] Created `common/` directory
- [x] Created `__tests__/unit/` directory
- [x] Created `__tests__/integration/` directory
- [x] Created `__tests__/property/` directory
- [x] Created `test-utils/builders/` directory
- [x] Created `test-utils/mocks/` directory
- [x] Created `test-utils/fixtures/` directory
- [ ] Reorganized existing files to new structure
- [ ] Updated import paths
- [ ] Applied naming conventions to files
- [ ] Moved tests to `__tests__/` directories

### ✅ Notification Service

- [x] Created `controllers/` directory
- [x] Created `services/` directory
- [x] Created `modules/` directory
- [x] Created `common/` directory
- [x] Created `__tests__/unit/` directory
- [x] Created `__tests__/integration/` directory
- [x] Created `__tests__/property/` directory
- [x] Created `test-utils/builders/` directory
- [x] Created `test-utils/mocks/` directory
- [x] Created `test-utils/fixtures/` directory
- [ ] Reorganized existing files to new structure
- [ ] Updated import paths
- [ ] Applied naming conventions to files
- [ ] Moved tests to `__tests__/` directories

### ✅ Search Service

- [x] Created `controllers/` directory
- [x] Created `services/` directory
- [x] Created `modules/` directory
- [x] Created `common/` directory
- [x] Created `__tests__/unit/` directory
- [x] Created `__tests__/integration/` directory
- [x] Created `__tests__/property/` directory
- [x] Created `test-utils/builders/` directory
- [x] Created `test-utils/mocks/` directory
- [x] Created `test-utils/fixtures/` directory
- [ ] Reorganized existing files to new structure
- [ ] Updated import paths
- [ ] Applied naming conventions to files
- [ ] Moved tests to `__tests__/` directories

### ✅ API Service

- [x] Created `__tests__/unit/` directory
- [x] Created `__tests__/integration/` directory
- [x] Created `__tests__/property/` directory
- [x] Created `test-utils/builders/` directory
- [x] Created `test-utils/mocks/` directory
- [x] Created `test-utils/fixtures/` directory
- [x] Already has `modules/` directory (good structure)
- [x] Already has `common/` directory (good structure)
- [x] Already has `services/` directory (good structure)
- [ ] Reorganized existing files to new structure
- [ ] Updated import paths
- [ ] Applied naming conventions to files
- [ ] Moved tests to `__tests__/` directories

## Naming Convention Checklist

### Controllers

- [ ] All controller files follow `{feature}.controller.ts` pattern
- [ ] All controllers are in `controllers/` directory
- [ ] All DTOs are in `controllers/dto/` directory

### Services

- [ ] All service files follow `{feature}.service.ts` pattern
- [ ] All services are in `services/` directory
- [ ] All service interfaces are in `services/interfaces/` directory

### Modules

- [ ] All module files follow `{feature}.module.ts` pattern
- [ ] All modules are in `modules/` directory
- [ ] Feature-specific modules are in `modules/{feature}/` subdirectories

### Common Utilities

- [ ] Decorators follow `{name}.decorator.ts` pattern
- [ ] Guards follow `{name}.guard.ts` pattern
- [ ] Interceptors follow `{name}.interceptor.ts` pattern
- [ ] Filters follow `{name}.filter.ts` pattern
- [ ] Middleware follow `{name}.middleware.ts` pattern
- [ ] Pipes follow `{name}.pipe.ts` pattern
- [ ] Utilities follow `{name}.util.ts` or `{name}.helper.ts` pattern

### Test Files

- [ ] Unit tests follow `{feature}.test.ts` pattern
- [ ] Unit tests are in `__tests__/unit/` directory
- [ ] Integration tests follow `{feature}.integration.test.ts` pattern
- [ ] Integration tests are in `__tests__/integration/` directory
- [ ] Property tests follow `{feature}.property.test.ts` pattern
- [ ] Property tests are in `__tests__/property/` directory

### Test Utilities

- [ ] Builders follow `{entity}.builder.ts` pattern
- [ ] Builders are in `test-utils/builders/` directory
- [ ] Mocks follow `{service}.mock.ts` pattern
- [ ] Mocks are in `test-utils/mocks/` directory
- [ ] Fixtures follow `{entity}.fixture.ts` pattern
- [ ] Fixtures are in `test-utils/fixtures/` directory

## Separation of Concerns Checklist

### Controllers

- [ ] Controllers only handle HTTP requests/responses
- [ ] Controllers use DTOs for input validation
- [ ] Controllers delegate business logic to services
- [ ] Controllers return appropriate HTTP status codes

### Services

- [ ] Services contain business logic
- [ ] Services handle data validation
- [ ] Services manage interactions with repositories
- [ ] Services throw domain-specific exceptions

### Modules

- [ ] Modules group related components
- [ ] Modules manage dependency injection
- [ ] Modules export public interfaces
- [ ] Modules handle feature-specific configuration

### Common Layer

- [ ] Common utilities are independent of business logic
- [ ] Common utilities are reusable across services
- [ ] Common utilities handle cross-cutting concerns
- [ ] Common utilities are well-documented

### Config Layer

- [ ] Configuration is loaded once at startup
- [ ] Configuration is validated on startup
- [ ] Configuration is environment-specific
- [ ] Configuration is typed and safe

## Import Path Standardization

- [ ] All imports use relative paths within the same service
- [ ] All imports from shared library use `@superboard/backend-shared`
- [ ] No circular dependencies between layers
- [ ] Import paths are consistent across all files

## Documentation

- [ ] README.md updated with new structure
- [ ] Architecture documentation updated
- [ ] Team trained on new structure
- [ ] Migration guide created for future services

## Verification

- [ ] All services follow the standardized structure
- [ ] All files follow naming conventions
- [ ] All tests are organized correctly
- [ ] All imports are updated
- [ ] No circular dependencies exist
- [ ] Code compiles without errors
- [ ] All tests pass

## Notes

- The API service already has a good module-based structure
- The Automation, Collaboration, Notification, and Search services need reorganization
- The AI Service (Python) will follow a similar structure adapted for Python conventions
- Test organization is critical for maintainability and consistency

## Timeline

- Phase 1: Create directory structure (✅ Complete)
- Phase 2: Reorganize existing files (In Progress)
- Phase 3: Update import paths (Pending)
- Phase 4: Apply naming conventions (Pending)
- Phase 5: Move tests to new locations (Pending)
- Phase 6: Verify and validate (Pending)
