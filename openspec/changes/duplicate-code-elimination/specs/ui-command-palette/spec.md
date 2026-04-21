## MODIFIED Requirements

### Requirement: ui-command-palette — single source of truth

The `CommandPalette` component MUST have exactly one canonical implementation.

#### Scenario: Only canonical CommandPalette exists

- **WHEN** a developer imports `CommandPalette` from `@/components/search/CommandPalette`
- **THEN** the component renders with categories, recent searches, and sync status

#### Scenario: Legacy import path is removed

- **WHEN** code attempts to import from `@/components/CommandPalette`
- **THEN** TypeScript compilation fails with module-not-found (expected — import must be updated)

### Requirement: notification barrel elimination

The `components/notifications/` folder MUST NOT contain a barrel `index.ts` when it only re-exports one file.

#### Scenario: Direct notification bell import

- **WHEN** code imports from `@/components/notifications/notification-bell`
- **THEN** the `NotificationBell` component is available

#### Scenario: Notification barrel is removed

- **WHEN** code attempts to import from `@/components/notifications`
- **THEN** TypeScript compilation fails with module-not-found (expected — import must be direct)
