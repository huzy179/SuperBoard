# Project Research Summary

**Project:** SuperBoard
**Domain:** AI-enhanced workflow super app for software development teams (brownfield)
**Researched:** 2026-03-19
**Confidence:** MEDIUM-HIGH

## Executive Summary

SuperBoard is best built as a workflow-first product with AI as an augmentation layer, not as an autonomous core. The current monorepo (Next.js + NestJS + Prisma + Postgres) is already the right backbone for this domain. The recommended path is to keep the existing product core stable and add AI through a hardened orchestrated boundary (API-controlled AI service, strict schemas, human approval before writes).

Research converges on a practical architecture: deterministic task/project workflows stay in API domain services, while AI handles draft generation, retrieval-grounded suggestions, and explainable recommendations. This pattern improves reliability and trust because AI is allowed to suggest and enrich, but canonical writes remain policy-checked and user-approved.

Primary risks are quality drift, excessive AI agency, schema/contract drift, and cost/latency sprawl. The mitigation strategy is clear: contract-first structured outputs, eval harness + regression gates, permission/risk-tiered actions, async queues for heavy jobs, and end-to-end observability with rollout flags.

## Key Findings

### Recommended Stack

Use the existing TypeScript monorepo core and harden it instead of re-platforming.

**Core technologies:**

- Next.js 16 + React 19: web shell and UX velocity with mature App Router patterns.
- NestJS 11: stable domain boundaries for auth, workflow invariants, and API orchestration.
- Prisma 7 + PostgreSQL: type-safe schema evolution and transactional source of truth.
- FastAPI AI service + OpenAI Responses API (Structured Outputs): deterministic AI contracts.
- pgvector on Postgres: retrieval in the same operational plane first; external vector DB only if justified.
- BullMQ + Redis: async handling for heavy AI workflows, retries, and backpressure.

### Expected Features

**Must have (table stakes):**

- Structured AI task generation from natural-language briefs.
- Mandatory human-in-the-loop review (accept/edit/reject) before task creation.
- Context-aware grounding with permission-safe retrieval.
- AI-assisted triage (dedupe/labels/project suggestions).
- Workflow primitives reliability (statuses/dependencies/blockers/subtasks).
- AI governance controls (who can do what, auditability).

**Should have (competitive differentiators):**

- Skill graph from real delivery signals.
- Skill-aware task decomposition and explainable assignment recommendations.
- Personalized per-task skill enablement guidance.
- Closed-loop learning from outcomes and feedback.
- Bounded-autonomy workflow copilot under policy controls.

**Defer (v2+):**

- Full autonomous task creation/assignment without approval.
- Generic chatbot-everywhere experiences.
- Big-bang all-in-one SDLC agent orchestration.
- Public ranking from raw AI skill scores.
- Dedicated vector database from day one.

### Architecture Approach

Adopt Task-Core + AI-Augmentation sidecar. `apps/web` calls `apps/api` only; API remains system of record; AI service is stateless and never directly mutates canonical task/project data.

**Major components:**

1. Core task/project/workspace modules in API — canonical workflow rules and writes.
2. AI orchestrator in API — prompt/version control, timeout/retry/fallback, tracing.
3. Skill intelligence module in API — explainable recommendations + feedback loop.
4. AI service — structured generation/summarization/retrieval/recommendation execution.
5. Shared contracts package — DTO/schema single source to prevent drift.

### Critical Pitfalls

1. **No eval harness in production** — seed regression datasets early and gate prompt/model changes.
2. **Excessive AI agency and weak security boundaries** — enforce zero-trust, allowlisted tools, risk-tiered actions, sandboxing.
3. **Schema/contract drift across web/API/AI** — use contract-first shared schemas with strict ingress/egress validation.
4. **Skipping human review too early** — keep suggest-first drafts and quality thresholds before autonomy.
5. **Unbounded cost/latency** — apply quotas/timeouts/model routing and track cost-to-value metrics.

## Implications for Roadmap

Based on combined research, this phase structure is recommended:

### Phase 1: Foundation Hardening (Contracts, Guardrails, Eval)

**Rationale:** All later AI value depends on stable contracts and safety boundaries.
**Delivers:** Shared DTO/schema baseline, structured output validation, policy matrix, initial eval harness, tracing basics.
**Addresses:** Governance + reliable AI scaffolding from table stakes.
**Avoids:** Contract drift, unchecked agency, invisible regressions.

### Phase 2: Draft-Based AI Task Generation MVP

**Rationale:** Fastest user-visible value with manageable risk.
**Delivers:** Natural-language to `TaskDraft[]`, approval/edit/reject UX, schema-validated draft persistence.
**Addresses:** Core table-stakes task generation + human-in-loop trust.
**Avoids:** Autonomous noisy backlog creation.

### Phase 3: Context Grounding + AI Triage

**Rationale:** Quality lift after MVP by reducing generic/hallucinated suggestions.
**Delivers:** pgvector-backed permission-safe retrieval, dedupe/label/project suggestion flows.
**Uses:** Postgres + pgvector, API orchestrator, shared contracts.
**Implements:** Retrieval lane + assistive triage patterns.

### Phase 4: Skill Intelligence v1

**Rationale:** Differentiation should come after reliable workflow + grounded AI.
**Delivers:** Skill profile signals, explainable recommendation artifacts, feedback capture loop.
**Addresses:** Skill graph and explainable recommendations differentiators.
**Avoids:** Opaque scoring and low-trust recommendations.

### Phase 5: Async Scale, Reliability, and Cost Optimization

**Rationale:** Scale controls should follow validated user value.
**Delivers:** BullMQ migration for heavy operations, idempotency/retries/DLQ, model routing, quota controls.
**Addresses:** Performance/cost table stakes at larger adoption.
**Avoids:** p95 latency spikes and runaway AI spend.

### Phase 6: Bounded Autonomy Expansion

**Rationale:** Agentic automation only after quality, safety, and observability maturity.
**Delivers:** Risk-tiered action execution, capability-level rollout flags, kill switches, progressive autonomy.
**Addresses:** Workflow copilot differentiator safely.
**Avoids:** System-wide incidents from broad agent permissions.

### Phase Ordering Rationale

- Contracts and guardrails come first because every AI capability depends on them.
- User-facing AI generation is prioritized early for immediate product impact with human approval controls.
- Retrieval and triage follow to improve suggestion quality using workspace context.
- Skill intelligence is sequenced after dependable task data/events exist.
- Async scaling and autonomy are intentionally delayed until observability, evals, and cost controls are proven.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 4 (Skill Intelligence v1):** recommendation semantics, scoring fairness, and ontology design.
- **Phase 6 (Bounded Autonomy Expansion):** sandbox scope, action policy granularity, and rollback ergonomics.

Phases with standard patterns (can usually skip extra research-phase):

- **Phase 1:** contract-first schemas, eval harness bootstrap, guardrails.
- **Phase 2:** draft/approval AI generation pattern.
- **Phase 5:** queue-based async scaling and cost/latency guardrails.

## Confidence Assessment

| Area         | Confidence  | Notes                                                                           |
| ------------ | ----------- | ------------------------------------------------------------------------------- |
| Stack        | HIGH        | Strong alignment with current codebase and official ecosystem direction.        |
| Features     | MEDIUM-HIGH | Table stakes are well-supported; differentiators depend on product calibration. |
| Architecture | HIGH        | Clear boundaries already fit monorepo and brownfield dependency order.          |
| Pitfalls     | HIGH        | Risks and mitigations are well-established in AI production guidance.           |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Recommendation quality metrics are defined conceptually but need concrete acceptance thresholds per capability.
- Skill ontology depth and fairness constraints require explicit product policy decisions.
- Tenant-level governance defaults (opt-in/out, autonomy levels) need final business rules before GA.
- Fallback behavior across AI providers needs explicit SLO-driven routing policy.

## Sources

### Primary (HIGH confidence)

- Internal research artifacts: `.planning/research/STACK.md`, `.planning/research/FEATURES.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md`
- Next.js docs/blog; NestJS docs/releases; Prisma docs/releases; OpenAI Responses/Structured Outputs docs; pgvector official docs.

### Secondary (MEDIUM confidence)

- Linear AI/docs, Notion AI/security docs, GitHub Copilot enterprise/agent management docs.

### Tertiary (LOW confidence)

- Supplemental ecosystem references for vector DB and orchestration tradeoffs where context is implementation-dependent.

---

_Research completed: 2026-03-19_
_Ready for roadmap: yes_
