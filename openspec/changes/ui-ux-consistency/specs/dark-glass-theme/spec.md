## ADDED Requirements

### Requirement: Dark glass card component

All card-type components within Jira, Chat, Docs, Automation, and Executive views SHALL use the dark glass aesthetic consisting of:

- Background: `bg-slate-950/80 backdrop-blur-3xl`
- Border: `border border-white/5`
- Shadow: `shadow-glass`
- Border radius: `rounded-[2rem]` for panels, `rounded-2xl` for nested cards
- Text color: white (`text-white`) or muted white (`text-white/60`, `text-white/40`)

#### Scenario: Filter bar renders in dark glass theme

- **WHEN** user navigates to a Jira project view
- **THEN** the task filter bar displays with `bg-slate-950/80 backdrop-blur-3xl border border-white/5 rounded-2xl` classes
- **AND** all filter chips use `bg-white/[0.03] border border-white/10 text-white` styling

#### Scenario: Calendar view renders in dark glass theme

- **WHEN** user navigates to calendar view
- **THEN** the calendar header and grid display with dark glass aesthetic matching filter bar
- **AND** calendar cells use `bg-slate-950/40 border border-white/5 rounded-xl` for in-month days
- **AND** out-of-month cells use `bg-slate-950/20 border border-white/5` for visual distinction

#### Scenario: Morning briefing renders in dark glass theme

- **WHEN** user views the executive dashboard morning briefing
- **THEN** all cards and containers use dark glass styling replacing `bg-white text-slate-950` with dark equivalents
- **AND** metric numbers display in `text-white` with muted labels in `text-white/40`

### Requirement: Dark glass input and interactive elements

Interactive elements (inputs, selects, buttons) within dark glass panels SHALL use consistent dark glass styling:

- Input backgrounds: `bg-white/[0.03] border border-white/10`
- Input text: `text-white placeholder:text-white/20`
- Select text: `text-white`
- Focus state: `focus:border-brand-500/40 focus:bg-white/[0.05]`

#### Scenario: Filter input in dark mode

- **WHEN** user types in the filter search input
- **THEN** the input shows `bg-white/[0.03] border border-white/10 text-white placeholder:text-white/20`
- **AND** focus state shows `focus:border-brand-500/40`

### Requirement: CSS utility class availability

The following CSS utility classes SHALL be available via `globals.css` for reuse across components:

- `.dark-glass-panel`: Full-width panel with glass effect
- `.dark-glass-card`: Individual card component
- `.dark-glass-input`: Input and select styling
- `.dark-glass-badge`: Status badge styling
- `.dark-glass-chip`: Toggle/filter chip styling (selected vs unselected states)

#### Scenario: Utility class application

- **WHEN** a developer applies `.dark-glass-card` to a div element
- **THEN** the element renders with `bg-slate-950/80 backdrop-blur-3xl border border-white/5 shadow-glass rounded-[2rem]`
