## ADDED Requirements

### Requirement: List comments for a task

The API SHALL expose `GET /api/v1/projects/:projectId/tasks/:taskId/comments` that returns all non-deleted comments for the given task, ordered by `createdAt` ascending (oldest first). The endpoint SHALL verify the project belongs to the user's workspace.

#### Scenario: List comments for a task with comments

- **WHEN** GET request is made with valid projectId and taskId
- **THEN** response is `ApiResponse<CommentItemDTO[]>` with all non-deleted comments ordered by createdAt ASC

#### Scenario: List comments for a task with no comments

- **WHEN** GET request is made for a task that has no comments
- **THEN** response is `ApiResponse<[]>` (empty array, not 404)

#### Scenario: Task not found

- **WHEN** GET request is made with a taskId that does not exist or is soft-deleted
- **THEN** response is 404 Not Found

#### Scenario: Project not in user's workspace

- **WHEN** GET request is made for a project that does not belong to the user's defaultWorkspaceId
- **THEN** response is 404 Not Found

### Requirement: Create a comment on a task

The API SHALL expose `POST /api/v1/projects/:projectId/tasks/:taskId/comments` that creates a new comment. The `authorId` SHALL be set to the authenticated user's ID. The request body SHALL contain `content` (string, required, non-empty after trim).

#### Scenario: Create comment successfully

- **WHEN** POST request is made with `{ content: "some text" }`
- **THEN** a new Comment record is created with `authorId` = current user, `taskId` = param, and response is `ApiResponse<CommentItemDTO>` with the created comment

#### Scenario: Create comment with empty content

- **WHEN** POST request is made with `{ content: "   " }` (whitespace only)
- **THEN** response is 400 Bad Request with message "Comment content is required"

#### Scenario: Create comment on deleted task

- **WHEN** POST request is made for a task where `deletedAt` is not null
- **THEN** response is 404 Not Found

### Requirement: Update a comment

The API SHALL expose `PATCH /api/v1/projects/:projectId/tasks/:taskId/comments/:commentId` that updates the comment's content. Only the comment's author SHALL be allowed to update it.

#### Scenario: Author updates their comment

- **WHEN** PATCH request is made by the comment's author with `{ content: "updated text" }`
- **THEN** the comment's content is updated and response is `ApiResponse<CommentItemDTO>`

#### Scenario: Non-author attempts to update

- **WHEN** PATCH request is made by a user who is NOT the comment's author
- **THEN** response is 403 Forbidden

#### Scenario: Update with empty content

- **WHEN** PATCH request is made with `{ content: "" }`
- **THEN** response is 400 Bad Request with message "Comment content is required"

#### Scenario: Comment not found

- **WHEN** PATCH request is made for a commentId that does not exist or is soft-deleted
- **THEN** response is 404 Not Found

### Requirement: Delete a comment (soft-delete)

The API SHALL expose `DELETE /api/v1/projects/:projectId/tasks/:taskId/comments/:commentId` that soft-deletes the comment by setting `deletedAt` to the current timestamp. Only the comment's author SHALL be allowed to delete it.

#### Scenario: Author deletes their comment

- **WHEN** DELETE request is made by the comment's author
- **THEN** the comment's `deletedAt` is set to current timestamp and response is `ApiResponse<{ deleted: true }>`

#### Scenario: Non-author attempts to delete

- **WHEN** DELETE request is made by a user who is NOT the comment's author
- **THEN** response is 403 Forbidden

#### Scenario: Comment already deleted

- **WHEN** DELETE request is made for a comment that is already soft-deleted
- **THEN** response is 404 Not Found

### Requirement: Comment DTO contract

The shared package SHALL export the following DTOs:

- `CommentItemDTO`: `{ id, taskId, authorId, authorName, content, createdAt, updatedAt }`
- `CreateCommentRequestDTO`: `{ content: string }`
- `UpdateCommentRequestDTO`: `{ content: string }`
- `CommentListResponseDTO`: `ApiResponse<CommentItemDTO[]>`
- `CreateCommentResponseDTO`: `ApiResponse<CommentItemDTO>`
- `UpdateCommentResponseDTO`: `ApiResponse<CommentItemDTO>`
- `DeleteCommentResponseDTO`: `ApiResponse<{ deleted: boolean }>`

#### Scenario: DTOs are importable from shared package

- **WHEN** API or web app imports `CommentItemDTO` from `@superboard/shared`
- **THEN** the type is available and includes all specified fields
