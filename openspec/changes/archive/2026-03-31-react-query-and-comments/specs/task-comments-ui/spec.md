## ADDED Requirements

### Requirement: Comment section in task detail panel

The task detail panel SHALL include a "Comments" section below the existing fields (description, timestamps). The section SHALL display a list of all comments and a form to add new comments.

#### Scenario: Comment section visible when task detail opens

- **WHEN** user clicks a task to open the detail panel
- **THEN** the Comments section is visible below the description field, showing existing comments and the add-comment form

### Requirement: Comment list display

Each comment in the list SHALL display: author name (or "You" for current user), content text, relative timestamp (e.g., "2 minutes ago"), and edit/delete buttons (visible only if current user is the author).

#### Scenario: Comments displayed in chronological order

- **WHEN** a task has multiple comments
- **THEN** comments are displayed oldest-first (ascending by createdAt)

#### Scenario: Empty comment state

- **WHEN** a task has no comments
- **THEN** the section shows "No comments yet" placeholder text

#### Scenario: Comments loading state

- **WHEN** comments are being fetched
- **THEN** the section shows a loading indicator (skeleton or spinner)

### Requirement: Add comment form

The comment section SHALL include a textarea and a submit button. The textarea placeholder SHALL be "Add a comment...". The submit button SHALL be disabled when the textarea is empty or when submission is in progress.

#### Scenario: Submit a new comment

- **WHEN** user types text in the textarea and clicks submit
- **THEN** the comment is created via API, the textarea is cleared, and the new comment appears in the list

#### Scenario: Submit button disabled when empty

- **WHEN** the textarea is empty or contains only whitespace
- **THEN** the submit button is disabled

#### Scenario: Error creating comment

- **WHEN** the create comment API call fails
- **THEN** an inline error message appears below the form with the error text, and the textarea content is preserved for retry

### Requirement: Edit comment inline

When the author clicks the edit button on their comment, the comment text SHALL be replaced with an editable textarea pre-filled with the current content, plus Save and Cancel buttons.

#### Scenario: Enter edit mode

- **WHEN** author clicks the edit button on their comment
- **THEN** the comment text is replaced with a textarea containing the current content, and Save/Cancel buttons appear

#### Scenario: Save edited comment

- **WHEN** author modifies the text and clicks Save
- **THEN** the comment is updated via API and the display returns to read mode with updated content

#### Scenario: Cancel edit

- **WHEN** author clicks Cancel during edit
- **THEN** the textarea is discarded and the original comment text is restored

#### Scenario: Error updating comment

- **WHEN** the update API call fails
- **THEN** an inline error message appears below the editing textarea, and the edit mode is preserved for retry

### Requirement: Delete comment with confirmation

When the author clicks the delete button on their comment, the system SHALL show a browser `confirm()` dialog. If confirmed, the comment SHALL be soft-deleted and disappear from the UI.

#### Scenario: Delete comment confirmed

- **WHEN** author clicks delete and confirms the dialog
- **THEN** the comment is deleted via API and removed from the displayed list

#### Scenario: Delete comment cancelled

- **WHEN** author clicks delete but cancels the dialog
- **THEN** nothing happens, the comment remains

#### Scenario: Error deleting comment

- **WHEN** the delete API call fails
- **THEN** an inline error message appears near the comment

### Requirement: Comment hooks using React Query

The comment UI SHALL use React Query hooks:

- `useTaskComments(projectId, taskId)` — `useQuery` with key `['projects', projectId, 'tasks', taskId, 'comments']`
- `useCreateComment(projectId, taskId)` — `useMutation` that invalidates the comments query on success
- `useUpdateComment(projectId, taskId)` — `useMutation` that invalidates the comments query on success
- `useDeleteComment(projectId, taskId)` — `useMutation` that invalidates the comments query on success

#### Scenario: Comments refetch after mutation

- **WHEN** a comment is created, updated, or deleted successfully
- **THEN** the comments query is invalidated and the list refreshes automatically
