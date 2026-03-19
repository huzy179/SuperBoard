# Architecture Patterns

**Domain:** AI-enhanced super app for software development teams (brownfield)
**Project:** SuperBoard
**Researched:** 2026-03-19
**Scope:** Integration-focused architecture for existing monorepo (`apps/web`, `apps/api`, `apps/ai-service`, `packages/shared`)

## Recommended Architecture

Adopt a **Task-Core + AI-Augmentation sidecar** architecture:

- Keep `apps/api` as the **system of record** for workspace/project/task lifecycle.
- Treat `apps/ai-service` as a **stateless AI capability service** (generate/summarize/semantic retrieval/recommendation).
- Route all user-facing operations through `apps/web -> apps/api`; avoid direct browser calls to `apps/ai-service`.
- Introduce a dedicated **Skill Intelligence module** in API (new domain module) that orchestrates AI outputs with project/task context, and persists explainable recommendations.
- Use `packages/shared` as strict contract boundary for all cross-app DTOs/events to prevent drift.

### Logical Diagram (target)

```text
[Web (Next.js)]
  |  REST (JWT)
  v
[API (NestJS)]
  |- Task/Project/Workspace Modules (source of truth)
  |- Skill Intelligence Module (orchestrator)
  |- AI Orchestrator Service (internal boundary)
  |- Queue/Jobs (optional for async AI)
  v
[AI Service (FastAPI/gRPC)]
  |- Task Generation
  |- Summarization
  |- Semantic Search
  |- Skill Recommendation Models

[PostgreSQL]
  ^ persisted entities + AI artifacts (versioned)

[Redis/BullMQ]
  ^ async AI jobs, retries, backpressure (feature-flagged)
```

## Component Boundaries

| Component                                    | Responsibility                                                                      | Owns Data                                                              | Communicates With                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/web`                                   | UI flows: task board, AI assist panel, skill insights                               | No durable business data                                               | `apps/api` only                                                 |
| `apps/api` `project/task/workspace` modules  | Canonical CRUD + workflow rules + authorization                                     | Project/Task/Workspace tables                                          | Prisma/Postgres, internal API services                          |
| `apps/api` `skill-intelligence` module (new) | Build skill graph from tasks, orchestrate AI recommendations, rank + explain output | SkillProfile, SkillRecommendation, RecommendationFeedback (new tables) | Task module, AI orchestrator, Prisma                            |
| `apps/api` `ai-orchestrator` service (new)   | Normalize prompts/contracts, call AI service, enforce timeout/retry/fallback policy | Request/response metadata, traces                                      | `apps/ai-service`, Queue, Logger                                |
| `apps/ai-service`                            | Execute model-specific logic; return deterministic structured outputs               | Ephemeral only (no source-of-truth writes)                             | API via HTTP/gRPC                                               |
| `packages/shared`                            | DTOs, schemas, enums, error codes for all app boundaries                            | Contracts only                                                         | Imported by web/api (and generated for ai-service where needed) |

### Boundary Rules (must enforce)

1. **No direct `web -> ai-service` calls**.
2. **No AI-side writes to canonical task/project data**.
3. **Task workflow transitions stay in API task domain service**; AI can suggest, not commit.
4. **All AI outputs must be versioned + attributable** (model, prompt template version, confidence, timestamp).
5. **Shared DTO package is mandatory for request/response contracts** (no ad-hoc payloads).

## Data Flow

### Flow A: Stable Task Workflow (baseline path)

1. User action in `web` triggers `project-service`/`task-service` call.
2. API `task` module validates auth/workspace ownership, executes domain rules, writes via Prisma.
3. API returns normalized envelope (`apiSuccess` / standardized error filter).
4. Web updates local state and revalidates UI.

**Properties:** deterministic, low-latency, independent of AI availability.

### Flow B: AI Task Augmentation (assistive path)

1. User submits natural-language intent in web AI panel (e.g., “break down this feature into tasks”).
2. Web sends request to API `ai-augmentation` endpoint (inside `task` or dedicated module).
3. API enriches context (project metadata, existing tasks, constraints), then calls `ai-orchestrator`.
4. `ai-orchestrator` invokes `ai-service` (sync for small payload; async job for heavy requests).
5. AI output returns as **draft artifacts** (`TaskDraft[]`, explanation, risk flags).
6. API validates schema + policy checks, persists draft artifacts separately.
7. User explicitly accepts/edit/rejects drafts; only then API commits canonical tasks.

**Properties:** human-in-the-loop, safe by default, no silent task mutation.

### Flow C: Skill Intelligence (continuous learning path)

1. Task lifecycle events (created/updated/completed) are emitted within API domain boundary.
2. `skill-intelligence` module aggregates event + content signals (labels, complexity, blockers, completion behavior).
3. Module requests recommendation/summarization from `ai-service` through `ai-orchestrator`.
4. API stores recommendations with explainability fields:
   - why suggested
   - related tasks/evidence
   - confidence score
   - expiration/re-evaluation policy
5. Web fetches ranked recommendations and allows user feedback (helpful/not helpful).
6. Feedback is persisted and fed into recommendation ranking logic.

**Properties:** explainable, auditable, improves over time with explicit feedback loop.

## Patterns to Follow

### Pattern 1: Orchestrator Facade for all AI calls

**What:** Single API service (`ai-orchestrator`) as gateway to AI providers.
**When:** Any AI-enhanced feature.
**Why:** Centralizes timeout, retries, tracing, prompt-template versioning, fallback behavior.

### Pattern 2: Draft-Commit split for AI-generated tasks

**What:** AI produces drafts; user confirms before commit.
**When:** Task decomposition, bulk generation, prioritization suggestions.
**Why:** Preserves workflow trust and prevents accidental data corruption.

### Pattern 3: Contract-first shared DTOs

**What:** Define/extend DTOs in `packages/shared` first, then implement web/api.
**When:** New AI or skill endpoints.
**Why:** Prevents payload drift and accelerates parallel development.

### Pattern 4: Event-driven enrichment (inside API first)

**What:** Emit domain events from task transitions and consume in skill-intelligence module.
**When:** Recommendation updates, analytics, notification hooks.
**Why:** Decouples task core from enrichment logic; safer incremental scaling.

## Anti-Patterns to Avoid

### Anti-Pattern 1: AI in critical write path

**What:** Blocking task create/update on AI response.
**Why bad:** AI latency/outage destabilizes core workflow.
**Instead:** Keep core path synchronous + deterministic; run AI as optional side path.

### Anti-Pattern 2: Prompt/business logic duplicated in web

**What:** Web assembling provider-specific prompts and parsing raw AI text.
**Why bad:** Contract chaos, security risks, impossible observability.
**Instead:** Keep prompt templates/parsing in API + ai-service only.

### Anti-Pattern 3: Unversioned recommendations

**What:** Storing recommendations without model/template metadata.
**Why bad:** No auditability, hard to debug regressions.
**Instead:** Persist metadata and evaluation fields for every recommendation artifact.

## Build-Order Implications (brownfield roadmap)

1. **Stabilize Task Core Contracts (Phase A)**
   - Freeze/clean task/project/workspace DTOs in `packages/shared`.
   - Ensure API domain invariants + error envelopes are consistent.
   - Outcome: stable foundation independent of AI.

2. **Introduce AI Orchestrator Boundary (Phase B)**
   - Add `ai-orchestrator` service + typed internal client in API.
   - Implement timeout/retry/fallback and request tracing.
   - Keep endpoints internal/feature-flagged initially.

3. **Deliver Draft-based AI Task Augmentation (Phase C)**
   - Add draft entities and user approval UX in web.
   - Expose “generate task draft” endpoint and schema validation.
   - Gate by workspace/project permissions.

4. **Add Skill Intelligence Module (Phase D)**
   - Add skill profile + recommendation persistence models.
   - Subscribe to task lifecycle events and generate explainable recommendations.
   - Implement user feedback loop for ranking improvements.

5. **Scale with Async + Queue (Phase E)**
   - Move heavy AI operations to BullMQ/Redis jobs.
   - Add retry policy, dead-letter handling, and idempotency keys.
   - Keep synchronous fallback for critical low-latency requests.

6. **Harden Observability + Quality Gates (Phase F)**
   - Correlation ID end-to-end (`web -> api -> ai-service`).
   - Add contract tests for shared DTOs and integration tests for orchestrator.
   - Track recommendation quality metrics and drift alerts.

### Why this order

- Core workflow stability must precede AI depth.
- Orchestrator boundary should exist before adding feature-specific AI endpoints.
- Skill intelligence depends on reliable task events and persisted artifacts.
- Async scaling should follow proven value, not lead architecture complexity.

## Scalability Considerations

| Concern                  | At 100 users                           | At 10K users                     | At 1M users                                          |
| ------------------------ | -------------------------------------- | -------------------------------- | ---------------------------------------------------- |
| Task CRUD latency        | Single API instance + Postgres indices | Horizontal API + DB tuning       | Partitioning/read replicas/caching strategy          |
| AI request volume        | Sync requests acceptable               | Queue heavy jobs + rate limit    | Multi-queue priority lanes + provider fallback tiers |
| Recommendation freshness | On-demand recompute                    | Event-driven incremental updates | Streaming/event bus + batched re-ranking             |
| Cost control             | Basic usage caps                       | Workspace quotas + model routing | Dynamic policy engine (tiered model selection)       |
| Explainability/audit     | Store metadata fields                  | Add evaluation dashboards        | Automated drift detection + policy enforcement       |

## Integration Checklist (implementation guardrails)

- [ ] New endpoints defined in `packages/shared` DTOs first.
- [ ] API modules enforce workspace-scoped auth on all AI/skill endpoints.
- [ ] AI outputs validated by schema before persistence.
- [ ] Draft artifacts separated from canonical task records.
- [ ] Recommendation records include evidence + confidence + model/template version.
- [ ] Correlation IDs propagated across API and AI service logs.
- [ ] Feature flags for incremental rollout per workspace.

## Confidence

| Area                                    | Confidence | Notes                                                                 |
| --------------------------------------- | ---------- | --------------------------------------------------------------------- |
| Monorepo integration boundaries         | HIGH       | Based on current internal architecture docs and codebase patterns     |
| AI orchestration structure              | MEDIUM     | Strong architectural fit, but AI service runtime currently stub-level |
| Skill intelligence data model direction | MEDIUM     | Depends on final product-level recommendation semantics               |
| Build-order recommendations             | HIGH       | Follows dependency order and brownfield risk minimization             |

## Sources

- Internal project intent: `.planning/PROJECT.md`
- Current codebase architecture: `.planning/codebase/ARCHITECTURE.md`
- Current integration surface: `.planning/codebase/INTEGRATIONS.md`
