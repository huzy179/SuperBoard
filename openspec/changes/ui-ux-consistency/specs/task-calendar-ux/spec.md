## ADDED Requirements

### Requirement: Calendar week view toggle

The calendar view SHALL support both month view and week view, switchable via a toggle control in the calendar header.

#### Scenario: User switches from month view to week view

- **WHEN** user clicks the week view toggle button
- **THEN** the calendar grid changes from 7-column month layout to 7-column week layout
- **AND** the week shows only tasks due within that 7-day range
- **AND** the navigation controls (prev/next) adjust by 1 week instead of 1 month

#### Scenario: User switches from week view to month view

- **WHEN** user clicks the month view toggle button
- **THEN** the calendar returns to the full month grid
- **AND** navigation adjusts back to month-by-month

### Requirement: Calendar drag-drop task rescheduling

Users SHALL be able to drag a task from one date cell to another and update the task's due date.

#### Scenario: Drag task to new date (month view)

- **WHEN** user drags a task card within the calendar month view
- **AND** drops it on a different date cell
- **THEN** the task's `dueDate` is updated to the new date via the task mutation API
- **AND** the task card moves to the new cell immediately (optimistic update)
- **AND** the original date cell updates to remove the task

#### Scenario: Drag task to new date (week view)

- **WHEN** user drags a task card within the calendar week view
- **AND** drops it on a different day column
- **THEN** the same behavior as month view applies (dueDate update via API)

#### Scenario: Drag-drop on same date is a no-op

- **WHEN** user drags a task and drops it on the same date it already has
- **THEN** no API call is made
- **AND** the task remains in its original position

### Requirement: Calendar header consistent styling

The calendar header navigation bar SHALL use dark glass styling matching the rest of the Jira view.

#### Scenario: Calendar navigation renders correctly

- **WHEN** user opens the calendar view
- **THEN** the navigation bar shows prev/next month buttons with dark glass button styling (`bg-white/[0.03] border border-white/5`)
- **AND** the month/week label displays in `text-white` with `text-sm font-semibold`
- **AND** the view toggle shows active/inactive states for month and week
