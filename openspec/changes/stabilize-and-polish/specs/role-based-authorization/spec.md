## ADDED Requirements

### Requirement: Role-based endpoint authorization

The SuperBoard API SHALL enforce role-based authorization on workspace-scoped endpoints. A `RolesGuard` SHALL check the caller's workspace role before executing destructive or administrative operations.

The guard SHALL:

- Extract the user's workspace role from the active workspace membership record
- Compare the user's role against the `@Roles()` decorator metadata on the target endpoint
- Return HTTP 403 Forbidden if the user's role is not in the required roles list
- Allow the request to proceed if no `@Roles()` decorator is present (endpoint is public within workspace)
- Be registered as a global guard alongside `BearerAuthGuard`

#### Scenario: Viewer attempts bulk task transition

- **WHEN** a user with workspace role `VIEWER` calls `POST /projects/:key/tasks/bulk-transition`
- **THEN** the `RolesGuard` evaluates the `@Roles('ADMIN', 'OWNER')` decorator
- **AND** returns HTTP 403 Forbidden with body `{ success: false, error: { code: 'FORBIDDEN', message: 'Không có quyền thực hiện thao tác này' } }`
- **AND** no tasks are modified

#### Scenario: Admin performs bulk task transition

- **WHEN** a user with workspace role `ADMIN` calls `POST /projects/:key/tasks/bulk-transition` with valid payload
- **THEN** the `RolesGuard` allows the request to proceed
- **AND** the bulk transition completes normally with 200 OK

#### Scenario: Endpoint without @Roles decorator allows any workspace member

- **WHEN** a user with workspace role `VIEWER` calls `GET /projects/:key/tasks` (no `@Roles` decorator)
- **THEN** the `RolesGuard` passes the request through without checking roles
- **AND** the endpoint returns 200 OK with task list

#### Scenario: Unauthenticated request is rejected before roles check

- **WHEN** an unauthenticated request (missing or invalid JWT) calls an endpoint with `@Roles('ADMIN', 'OWNER')`
- **THEN** the `BearerAuthGuard` rejects the request with 401 Unauthorized
- **AND** the `RolesGuard` is never invoked

### Requirement: Protected admin endpoints

The following endpoints SHALL require `ADMIN` or `OWNER` workspace role:

| Endpoint                               | Method | Decorator                  |
| -------------------------------------- | ------ | -------------------------- |
| `/projects/:key/tasks/bulk-transition` | POST   | `@Roles('ADMIN', 'OWNER')` |
| `/projects/:key`                       | DELETE | `@Roles('ADMIN', 'OWNER')` |
| `/projects/:key/workflow`              | PATCH  | `@Roles('ADMIN', 'OWNER')` |
| `/workspaces/:id/members/:userId`      | DELETE | `@Roles('ADMIN', 'OWNER')` |
| `/automation/rules`                    | POST   | `@Roles('ADMIN', 'OWNER')` |
| `/automation/rules/:id`                | DELETE | `@Roles('ADMIN', 'OWNER')` |

#### Scenario: Viewer cannot delete a project

- **WHEN** a user with workspace role `VIEWER` calls `DELETE /projects/:key`
- **THEN** the response is HTTP 403 Forbidden with code `FORBIDDEN`
- **AND** the project remains unchanged in the database

#### Scenario: Owner can delete a project

- **WHEN** a user with workspace role `OWNER` calls `DELETE /projects/:key`
- **THEN** the response is HTTP 200 OK
- **AND** the project is soft-deleted (deletedAt set to current timestamp)
