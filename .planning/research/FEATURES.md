# Feature Landscape

**Domain:** AI-enhanced super app for software development teams
**Researched:** 2026-03-19
**Context:** Brownfield expansion on existing auth + workspace/project/task foundation

## Table Stakes (2026)

Features users now expect by default in dev-team workflow products. Missing these makes the product feel behind.

| Feature                                                                              | Why Expected in 2026                                                                                                             | Complexity  | Dependencies / Notes                                                                                        |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| Structured AI task generation from natural-language brief                            | Teams expect AI to convert specs/bugs/meeting notes into actionable tasks with title, description, acceptance criteria, priority | Medium      | Depends on clean project/task schema, prompt templates, output validation, edit-before-save UX              |
| Human-in-the-loop approval for AI output                                             | Trust + correctness requirement: AI suggestions must be reviewable and editable before creation/assignment                       | Low-Medium  | Depends on draft state + diff view + explicit “accept/edit/reject” controls                                 |
| AI-assisted triage (dedupe, labels, project/team suggestion)                         | Modern issue trackers increasingly auto-triage to reduce backlog noise                                                           | Medium-High | Depends on historical issue/task data quality and retrieval/search capability                               |
| Context-aware AI grounded in workspace data                                          | Teams expect AI answers/suggestions to use current project context, not generic chat output                                      | High        | Depends on permission-aware retrieval (docs/tasks/repos), embeddings/vector index, source citation snippets |
| Robust team workflow primitives (custom statuses, dependencies, blockers, sub-tasks) | Baseline for serious software delivery coordination                                                                              | Medium      | Mostly existing foundation; needs consistent API + UI behavior + migration-safe data model                  |
| Collaboration summaries (standup/weekly/project pulse)                               | Teams expect auto-summaries to reduce coordination overhead                                                                      | Medium      | Depends on event/task timeline capture + summarization templates                                            |
| AI governance controls (who can use what, audit logs)                                | Enterprise and scale-up teams increasingly require AI action traceability                                                        | Medium      | Depends on org/workspace roles, action logging, policy flags                                                |
| Integrations-first workflow (GitHub/Slack/calendar/knowledge)                        | Dev teams expect toolchain interoperability rather than isolated task app                                                        | Medium-High | Depends on stable integration boundaries and idempotent sync model                                          |

## Differentiators (High-Value, Not Universal Yet)

Features that can materially differentiate SuperBoard in this domain.

| Feature                                     | Value Proposition                                                                                          | Complexity  | Dependencies / Notes                                                                    |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| Skill graph tied to real task execution     | Turns task history into a living map of team capabilities (skills proven by shipped work, not self-report) | High        | Depends on task taxonomy, competency ontology, and outcome signals from task lifecycle  |
| Skill-aware AI task decomposition           | AI breaks work into tasks calibrated to team capability and growth goals (not only speed)                  | High        | Depends on skill graph + reliable estimation + decomposition quality checks             |
| Personalized skill enablement per task      | Every task can provide “learn while doing” guidance: concepts, references, mini-checklists, risk hints     | Medium-High | Depends on context retrieval + curated knowledge links + role/seniority profiles        |
| Explainable assignment recommendations      | Recommendation includes “why this person/team” with alternatives and confidence                            | Medium-High | Depends on historical delivery metrics + workload + skill signals + transparent scoring |
| Closed-loop learning from delivery outcomes | System learns from reopened bugs, cycle time, review churn to improve future AI task generation            | High        | Depends on instrumentation, feedback capture, and model/prompt evaluation loop          |
| Team workflow copilot with bounded autonomy | Safe automation of repetitive flows (triage, status updates, reminder nudges) with policy constraints      | High        | Depends on workflow engine hooks, permission model, and failure rollback paths          |

## Anti-Features (Explicitly Avoid)

These commonly look attractive but create disproportionate risk for this product stage.

| Anti-Feature                                                           | Why Avoid                                                                                      | What to Do Instead                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Fully autonomous task creation + assignment without human confirmation | High risk of noisy backlog, bad ownership, and trust collapse                                  | Require draft + review/approval loop by default; add gradual automation levels later |
| Generic “chatbot everywhere” with weak grounding                       | Produces plausible but low-utility answers; increases hallucination risk in workflow decisions | Prioritize workflow-embedded actions with context grounding + source references      |
| Big-bang all-in-one agent orchestrating entire SDLC in v1              | Very high integration and reliability risk in brownfield base                                  | Roll out narrow, high-confidence automations per workflow step                       |
| Public team ranking based on raw AI skill scores                       | Harms team culture, creates gaming behavior and fairness concerns                              | Use private/coaching-oriented skill insights focused on growth                       |
| Building custom model-serving platform too early                       | Distracts from product differentiation and delivery speed                                      | Stay model-agnostic via provider abstraction; invest in eval/guardrails/product UX   |
| Over-automated notifications and AI spam summaries                     | Leads to alert fatigue and reduced trust in system recommendations                             | Add digest controls, relevance thresholds, and opt-in channels                       |

## Feature Dependencies

```text
Robust domain foundation (workspace/project/task + statuses + dependencies)
  -> Structured AI task generation drafts
    -> Human review/approval loop
      -> AI-assisted triage & workflow automations

Permission model + audit logging
  -> Context-aware retrieval (RAG-like grounding)
    -> Explainable recommendations
      -> Bounded autonomy agents

Task taxonomy + historical outcomes
  -> Skill graph
    -> Skill-aware decomposition
      -> Personalized skill enablement
        -> Closed-loop learning optimization
```

## MVP Recommendation for This Brownfield Milestone

Prioritize in order:

1. Structured AI task generation with mandatory human review/edit.
2. Context-aware grounding + permission-safe retrieval for AI suggestions.
3. AI-assisted triage (dedupe/label/project suggestion) for backlog quality.
4. Robust workflow reliability upgrades (dependencies/blockers/sub-task consistency).
5. Initial skill insight layer (skill signals from task outcomes, no public scoring).

Defer for later milestone:

- Full autonomous multi-step agents (needs stronger governance + reliability telemetry).
- Advanced enterprise analytics dashboards beyond essential AI audit/control metrics.

## Confidence Notes

- **HIGH:** Human-in-loop AI patterns, governance controls, and agent management requirements (verified via official GitHub/Notion docs).
- **MEDIUM:** AI workflow product direction for software teams (verified via official product pages/docs from GitHub, Linear, Notion).
- **LOW:** Specific Atlassian/Jira AI details in this run due fetch limitations (tracking redirects/content extraction issues).

## Sources

- GitHub Copilot product overview: https://github.com/features/copilot
- GitHub Docs — Agent management for enterprises: https://docs.github.com/en/copilot/concepts/agents/enterprise-management
- Linear AI overview: https://linear.app/ai
- Linear docs overview: https://linear.app/docs
- Notion AI product: https://www.notion.com/product/ai
- Notion AI security & privacy practices: https://www.notion.com/help/notion-ai-security-practices
