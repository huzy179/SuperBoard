## REMOVED Requirements

### Requirement: Orphan file elimination

Dead code elimination removes files that are no longer part of the active codebase.

#### Scenario: Orphan `.old` file exists

- **WHEN** a `.old` file exists in `src/` that is not imported anywhere
- **THEN** it is deleted

#### Scenario: No orphan files in source tree

- **WHEN** a developer runs `find apps -name "*.old" -type f`
- **THEN** zero results are returned

### Requirement: Dead comment removal

Resolved `// TODO:`, `// FIXME:`, `// HACK:` blocks that describe completed work are removed.

#### Scenario: Resolved comment blocks in web source

- **WHEN** a resolved TODO/FIXME/HACK comment exists in `apps/web/src/`
- **THEN** the comment block is removed

#### Scenario: Resolved comment blocks in api source

- **WHEN** a resolved TODO/FIXME/HACK comment exists in `apps/api/src/`
- **THEN** the comment block is removed

### Requirement: Unused export detection

Functions and components exported but never imported are identified and removed.

#### Scenario: Unused named exports in web source

- **WHEN** a named export in `apps/web/src/` is not imported anywhere in the codebase
- **THEN** it is removed after manual verification

#### Scenario: Unused named exports in api source

- **WHEN** a named export in `apps/api/src/` is not imported anywhere in the codebase
- **THEN** it is removed after manual verification
