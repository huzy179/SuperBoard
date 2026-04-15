## ADDED Requirements

### Requirement: AI panel skeleton loading states

AI-powered insight panels in the task edit slide-over SHALL display skeleton loading states while their data is being fetched.

#### Scenario: Task Intelligence panel shows skeleton while loading

- **WHEN** user opens a task in the edit slide-over
- **AND** the task intelligence data is not yet available (first load)
- **THEN** the Neural Triage Suggestions panel displays a skeleton placeholder
- **AND** the skeleton matches the approximate size of the panel content
- **AND** the skeleton disappears when data arrives, replaced by actual content

#### Scenario: Semantic Duplicate Warning panel shows skeleton while loading

- **WHEN** user opens a task
- **AND** duplicate detection is running in the background
- **THEN** the Semantic Duplicate Warning panel shows a skeleton loading state
- **AND** content appears when duplicate results are available

#### Scenario: Intelligent Briefing panel shows skeleton while loading

- **WHEN** user clicks "Executive Brief" AI action
- **AND** the AI is generating the summary
- **THEN** a skeleton or loading indicator displays within the briefing panel
- **AND** the briefing text appears when generation completes

#### Scenario: Neural Health Forecast panel shows skeleton while loading

- **WHEN** user opens a task with prediction data not yet loaded
- **THEN** the health forecast section shows a skeleton placeholder
- **AND** the forecast card (with estimated completion and risk assessment) replaces the skeleton once data arrives

### Requirement: Skeleton visual design

Skeleton loading states SHALL use the following design to match the dark glass aesthetic:

- Background: `bg-white/[0.03] animate-pulse`
- Border radius: matching the panel's border radius (`rounded-[2.5rem]`)
- Placeholder shapes approximating the actual content layout (title bar, content lines)
- Duration: `animate-pulse` with `duration-1000` timing

#### Scenario: Skeleton blends with dark glass theme

- **WHEN** skeleton loading states are displayed
- **THEN** they visually blend with the surrounding dark glass panels
- **AND** no jarring visual pop when real content replaces the skeleton
