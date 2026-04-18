## ADDED Requirements

### Requirement: Feature section error boundaries

All high-risk feature sections (AI panels, board views, dashboard widgets) within the SuperBoard web application SHALL be wrapped in React error boundaries that prevent component failures from crashing the entire page.

The error boundary SHALL:

- Catch JavaScript errors thrown by child components during rendering, lifecycle methods, or constructors
- Render a `FullPageError` or `SectionError` fallback UI when an error is caught
- NOT catch: event handlers, async code (setTimeout, promises), server-side rendering errors
- Allow the rest of the page to remain interactive when one section crashes

#### Scenario: NeuralWorkspaceDigest crashes silently

- **WHEN** the `/api/v1/ai/workspace-digest` API fails with a 5xx error
- **THEN** the `NeuralWorkspaceDigest` component renders the `FullPageError` fallback with a "Thử lại" (Retry) button
- **AND** the rest of the Jira page (project grid, filter bar, sidebar) remains fully interactive

#### Scenario: DashboardModule AI config is invalid

- **WHEN** `JSON.parse(aiLayout)` in the dashboard page throws a `SyntaxError` or the parsed module has an unknown `type` field
- **THEN** the `DashboardModule` renders the `SectionError` fallback with an error message
- **AND** the `StatCard` components and other non-crashed widgets remain visible and interactive

#### Scenario: TaskBoardView throws during drag operation

- **WHEN** a drag operation in `TaskBoardView` throws an uncaught exception
- **THEN** the error boundary catches it and displays a non-blocking toast notification
- **AND** the board remains in its pre-drag state, allowing the user to continue working

### Requirement: Loading states for async feature sections

Async feature sections (AI panels, dashboard widgets, data-fetching components) SHALL display skeleton loading states while their data is being fetched. The skeleton UI SHALL use the dark glass aesthetic (`bg-white/[0.02] animate-pulse rounded-[2rem]`) to match the application's theme.

#### Scenario: NeuralWorkspaceDigest shows skeleton on initial load

- **WHEN** the user navigates to the Jira page and `NeuralWorkspaceDigest` begins fetching
- **THEN** a skeleton panel renders immediately with dark glass pulse animation
- **AND** the skeleton matches the approximate dimensions of the expected content (header + content rows)
- **AND** the rest of the page is already rendered and interactive

#### Scenario: Lazy-loaded component shows loading fallback

- **WHEN** `RichTextEditor` is dynamically imported with `ssr: false`
- **THEN** the `loading` fallback renders a skeleton that matches the editor's expected dimensions
- **AND** no layout shift occurs when the actual editor loads
- **AND** the skeleton uses the dark glass theme matching the docs page aesthetic
