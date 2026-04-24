# Error Code Catalog v1

This catalog lists all standardized error codes used across the Superboard API, organized by domain.
Each error response includes a `code` field matching one of the entries below.

---

## AUTH

| Code                       | Description                                                             | HTTP Status |
| -------------------------- | ----------------------------------------------------------------------- | ----------- |
| `AUTH_TOKEN_INVALID`       | The provided authentication token is malformed or not recognized.       | 401         |
| `AUTH_TOKEN_EXPIRED`       | The authentication token has expired and must be refreshed.             | 401         |
| `AUTH_CREDENTIALS_INVALID` | The supplied credentials (e.g. email/password) are incorrect.           | 401         |
| `AUTH_PERMISSION_DENIED`   | The authenticated user does not have permission to perform this action. | 403         |

---

## WORKSPACE

| Code                         | Description                                             | HTTP Status |
| ---------------------------- | ------------------------------------------------------- | ----------- |
| `WORKSPACE_NOT_FOUND`        | No workspace exists with the given identifier.          | 404         |
| `WORKSPACE_MEMBER_NOT_FOUND` | The specified user is not a member of this workspace.   | 404         |
| `WORKSPACE_LIMIT_EXCEEDED`   | The workspace has reached its resource or member limit. | 422         |

---

## PROJECT

| Code                       | Description                                         | HTTP Status |
| -------------------------- | --------------------------------------------------- | ----------- |
| `PROJECT_NOT_FOUND`        | No project exists with the given identifier.        | 404         |
| `PROJECT_MEMBER_NOT_FOUND` | The specified user is not a member of this project. | 404         |
| `PROJECT_ARCHIVED`         | The project is archived and cannot be modified.     | 422         |

---

## TASK

| Code                       | Description                                                   | HTTP Status |
| -------------------------- | ------------------------------------------------------------- | ----------- |
| `TASK_NOT_FOUND`           | No task exists with the given identifier.                     | 404         |
| `TASK_STATUS_INVALID`      | The requested status transition is not allowed for this task. | 422         |
| `TASK_ASSIGNEE_NOT_MEMBER` | The user being assigned is not a member of the project.       | 422         |

---

## Generic

| Code                  | Description                                         | HTTP Status |
| --------------------- | --------------------------------------------------- | ----------- |
| `VALIDATION_FAILED`   | The request body or parameters failed validation.   | 400         |
| `INTERNAL_ERROR`      | An unexpected server-side error occurred.           | 500         |
| `RATE_LIMIT_EXCEEDED` | Too many requests have been made in a short period. | 429         |
