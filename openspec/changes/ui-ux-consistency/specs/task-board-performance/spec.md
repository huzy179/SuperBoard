## ADDED Requirements

### Requirement: Board view dragged task lookup performance

The `draggedTask` lookup in `TaskBoardView` SHALL use `useMemo` to avoid recomputing on every render.

#### Scenario: Dragging a task computes allowed target statuses efficiently

- **WHEN** user starts dragging a task card
- **THEN** `draggedTask` is memoized from `boardData` keyed on `[draggedTaskId, boardData]`
- **AND** `allowedStatuses` is memoized from `workflow` and `draggedTask` keyed on `[draggedTask, workflow]`
- **AND** no nested for-of loop runs on renders where neither `draggedTaskId` nor `boardData` has changed

### Requirement: Board column responsive layout

Board columns SHALL use `min-w-[20rem]` instead of `w-80` to maintain readability on all screen widths.

#### Scenario: Board renders on wide screen

- **WHEN** board view renders on a screen wider than 1280px
- **THEN** columns maintain `min-w-[20rem]` width and are scrollable horizontally via `overflow-x-auto`

#### Scenario: Board renders on medium screen (1024px–1280px)

- **WHEN** board view renders on a screen between 1024px and 1280px
- **THEN** columns render at `min-w-[20rem]` and horizontal scroll is available
- **AND** no column content is truncated or compressed below readability threshold

### Requirement: Task card height consistency

Task cards SHALL have a maximum height with overflow handling to prevent disproportionate card sizes when displaying many labels.

#### Scenario: Task card with many labels

- **WHEN** a task card has more than 3 labels
- **THEN** labels beyond the first row are truncated or wrapped within a bounded height
- **AND** the card height does not exceed approximately 2x the height of a single-label card
