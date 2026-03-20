## ADDED Requirements

### Requirement: QueryClientProvider wraps authenticated pages

The web app SHALL configure a React Query `QueryClientProvider` that wraps all authenticated (private) pages. The provider SHALL be placed in `apps/web/app/(private)/layout.tsx`.

#### Scenario: Provider is available in private routes

- **WHEN** a user navigates to any route under `/(private)/`
- **THEN** React Query context is available and `useQuery`/`useMutation` hooks function correctly

#### Scenario: Provider is not present on public routes

- **WHEN** a user is on a public route (e.g., `/login`)
- **THEN** React Query provider is not loaded (no unnecessary JS)

### Requirement: QueryClient default configuration

The QueryClient SHALL be configured with the following defaults:

- `staleTime`: 30000ms (30 seconds)
- `gcTime`: 300000ms (5 minutes)
- `retry`: 1
- `refetchOnWindowFocus`: true

#### Scenario: Stale data triggers background refetch

- **WHEN** a query's data is older than 30 seconds and the component re-renders
- **THEN** React Query triggers a background refetch while showing stale data

#### Scenario: Failed query retries once

- **WHEN** a query fails on the first attempt
- **THEN** React Query retries the query once before entering error state

### Requirement: React Query Devtools in development

The app SHALL include React Query Devtools only in development mode (`process.env.NODE_ENV === 'development'`). Devtools SHALL NOT be included in production bundles.

#### Scenario: Devtools visible in development

- **WHEN** the app runs in development mode
- **THEN** the React Query Devtools floating button is visible and functional

#### Scenario: Devtools absent in production

- **WHEN** the app runs in production mode
- **THEN** no devtools code is included in the bundle
