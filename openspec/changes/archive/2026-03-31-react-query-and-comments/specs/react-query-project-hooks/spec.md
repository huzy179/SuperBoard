## ADDED Requirements

### Requirement: Project list query hook

The system SHALL provide a `useProjects` hook that fetches the project list using React Query. The hook SHALL use query key `['projects']` and call the existing `getProjects()` service function.

#### Scenario: Project list loads successfully

- **WHEN** the Jira home page mounts
- **THEN** `useProjects` returns `{ data: ProjectItemDTO[], isLoading, isError }` and the project list renders

#### Scenario: Project list loading state

- **WHEN** the project list query is in flight
- **THEN** `isLoading` is true and the page shows a loading indicator

#### Scenario: Project list error state

- **WHEN** the project list query fails after retry
- **THEN** `isError` is true and the page shows an error message

### Requirement: Project detail query hook

The system SHALL provide a `useProjectDetail` hook that fetches a single project with its tasks using React Query. The hook SHALL use query key `['projects', projectId]` and call the existing `getProjectDetail()` service function.

#### Scenario: Project detail loads with tasks

- **WHEN** the project detail page mounts with a valid projectId
- **THEN** `useProjectDetail` returns the project with its task list

#### Scenario: Project detail loading state

- **WHEN** the project detail query is in flight
- **THEN** `isLoading` is true and the page shows a loading indicator

### Requirement: Task create mutation hook

The system SHALL provide a `useCreateTask` hook using `useMutation` that calls `createProjectTask()`. On success, it SHALL invalidate the `['projects', projectId]` query to refresh the task list.

#### Scenario: Task created successfully

- **WHEN** user submits the create task form with valid data
- **THEN** the mutation calls the API, and on success the project detail query is invalidated causing the task list to refresh

#### Scenario: Task creation fails

- **WHEN** the create task API call fails
- **THEN** the mutation's `isError` is true and `error.message` is available for display

### Requirement: Task status mutation with optimistic update

The system SHALL provide a `useUpdateTaskStatus` hook using `useMutation` with optimistic updates. On `onMutate`, it SHALL snapshot the current cache, update the task's status in the cache immediately, and roll back on error.

#### Scenario: Drag-drop status change with optimistic update

- **WHEN** user drags a task to a different status column
- **THEN** the task immediately appears in the new column (optimistic), and the API call happens in the background

#### Scenario: Optimistic update rollback on failure

- **WHEN** the status update API call fails
- **THEN** the task reverts to its original column and an error message is shown

### Requirement: Task update mutation hook

The system SHALL provide a `useUpdateTask` hook using `useMutation` that calls `updateProjectTask()`. On success, it SHALL invalidate the `['projects', projectId]` query.

#### Scenario: Task updated successfully

- **WHEN** user saves changes in the task detail panel
- **THEN** the mutation calls the API, and on success the project detail query is invalidated

### Requirement: Task delete mutation hook

The system SHALL provide a `useDeleteTask` hook using `useMutation` that calls `deleteProjectTask()`. On success, it SHALL invalidate the `['projects', projectId]` query.

#### Scenario: Task deleted successfully

- **WHEN** user confirms task deletion in the detail panel
- **THEN** the mutation calls the API, and on success the project detail query is invalidated and the detail panel closes

### Requirement: Project list page refactored to use hooks

The Jira home page SHALL use `useProjects` instead of manual `useEffect` + `useState` for fetching the project list. Manual loading/error state variables SHALL be removed.

#### Scenario: Project list page uses React Query

- **WHEN** the Jira home page renders
- **THEN** it uses `useProjects()` hook and derives loading/error/data from the hook return value

### Requirement: Project detail page refactored to use hooks

The project detail page SHALL use `useProjectDetail` and task mutation hooks instead of manual `useEffect` + `useState` + `reloadSeed`. The `reloadSeed` counter pattern SHALL be removed entirely.

#### Scenario: Project detail page uses React Query

- **WHEN** the project detail page renders
- **THEN** it uses `useProjectDetail(projectId)` and task mutation hooks, with no `reloadSeed` state variable
