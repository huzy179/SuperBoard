# Technology Stack (Brownfield, 2026)

**Project:** SuperBoard (AI-enhanced super app for software development teams)  
**Researched:** 2026-03-19  
**Mode:** Ecosystem / Stack dimension (subsequent milestone, brownfield)  
**Overall confidence:** MEDIUM-HIGH

## Recommendation Summary

For this repo, the **standard 2026 stack direction** is: keep the existing TypeScript monorepo core (Next.js + NestJS + Prisma + Postgres) and add AI capability through a hardened Python AI service using structured outputs, tool-calling, vector retrieval, and async background execution.

This is the best fit because the current architecture already has clear domain modules, shared DTOs, and a dedicated AI service boundary. Re-platforming would add risk without improving MVP velocity.

## Recommended Stack (for this codebase)

### 1) Product Core (keep + harden)

| Layer           | Technology                 | Version Track            | Purpose                                             | Why this is standard 2026 for this repo                                                                                               | Confidence |
| --------------- | -------------------------- | ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Web app         | Next.js App Router + React | Next.js 16.x, React 19.x | Product UI, route-grouped app shell                 | Next.js 16.x is current/stable line with App Router maturity and strong DX/perf trajectory; aligns with current app structure         | HIGH       |
| API             | NestJS                     | 11.x                     | Domain API, auth, guards, module boundaries         | Existing modular Nest architecture already matches team/product domain boundaries and scales cleanly for enterprise-ish workflow APIs | HIGH       |
| ORM/Data access | Prisma ORM + adapter-pg    | 7.x                      | Type-safe schema evolution, migrations, query layer | Prisma 7.x is active/current and already integrated; avoids contract drift between API and DB                                         | HIGH       |
| Primary DB      | PostgreSQL                 | 16–18 class              | OLTP, relational source of truth                    | Still standard for task/project/workspace products with strong transactional consistency needs                                        | HIGH       |
| Monorepo        | Turborepo + npm workspaces | Turbo 2.x                | Incremental builds, coordinated dev                 | Already operational and appropriate for web/api/shared packages                                                                       | HIGH       |

### 2) AI Application Layer (additions on top of existing AI service)

| Layer                        | Technology                                                             | Version Track                 | Purpose                                           | Recommendation for this repo                                                                                                           | Confidence |
| ---------------------------- | ---------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| AI runtime API               | FastAPI + Uvicorn                                                      | FastAPI 0.115+, Uvicorn 0.34+ | AI HTTP boundary                                  | Keep current service; add explicit internal API contracts per AI capability (task generation, summarization, skill guidance)           | HIGH       |
| Provider integration         | OpenAI Responses API + Structured Outputs (+ existing Gemini fallback) | Responses API (current)       | Reliable JSON outputs, tool loops                 | Prefer Responses API for new flows; keep provider abstraction to swap models and manage cost/latency routing                           | HIGH       |
| Agent/workflow orchestration | LangGraph (targeted usage)                                             | current OSS track             | Stateful multi-step orchestration with guardrails | Use only for truly multi-step flows (plan→retrieve→validate→draft). Keep simple single-shot flows plain function calls                 | MEDIUM     |
| Embeddings/retrieval         | Postgres + pgvector                                                    | pgvector 0.8.x                | Semantic search over workspace/task knowledge     | Stay in Postgres first (single operational plane), use HNSW/IVFFlat + metadata filters; defer external vector DB until scale justifies | HIGH       |
| Async execution              | BullMQ + Redis                                                         | already in repo               | Long-running AI jobs, retries, backpressure       | Standard for AI-assisted task processing where generation/rerank may be slow                                                           | HIGH       |

### 3) Reliability, Observability, and Governance (must-add for AI features)

| Concern            | Technology                                        | Recommendation                                                                                   | Confidence  |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------- |
| Traceability       | Correlation IDs + SQL comments + tracing hooks    | Extend existing request context to AI calls + DB retrieval paths; annotate AI-generated writes   | MEDIUM-HIGH |
| Schema safety      | Zod (TS) + Pydantic (Python) + Structured Outputs | Enforce strict schema from prompt output to API contract; no free-form JSON in critical flows    | HIGH        |
| AI safety controls | Moderation + refusal handling + fallback policy   | Handle refusal/error states explicitly in UX and APIs; avoid silent retries with mutated prompts | MEDIUM      |
| Eval loop          | Lightweight offline + regression eval set         | Add phase-specific eval dataset for task generation quality and hallucination checks             | MEDIUM      |

## Practical Architecture Pattern for New Features

Use a **three-lane AI flow**:

1. **Sync lane (request/response)** for short actions (rewrite title, quick summarize).
2. **Async lane (BullMQ)** for expensive actions (multi-task decomposition, enrichment).
3. **Retrieval lane (pgvector + metadata filter)** for workspace-aware context injection.

This keeps UX responsive while preserving correctness and cost control.

## What to Use vs What Not to Use (repo-context specific)

### Use

- Keep **Next.js 16 + NestJS 11 + Prisma 7 + Postgres** as backbone.
- Use **OpenAI Responses API + Structured Outputs** for deterministic contracts.
- Keep **Gemini provider** as optional secondary provider (cost/latency/regional fallback).
- Use **pgvector first** for semantic retrieval in same Postgres operational domain.
- Use **BullMQ** for long AI workflows and retries.

### Avoid (for this milestone)

- **Do not re-platform** API to a new backend framework (e.g., Hono/tRPC-first rewrite) in this phase.
- **Do not split into many new microservices** beyond current AI boundary; premature fragmentation will slow delivery.
- **Do not adopt Assistants API for net-new flows** (Responses API is the forward path).
- **Do not introduce a dedicated vector DB immediately** (Pinecone/Weaviate/Milvus) unless pgvector recall/latency/cost is proven insufficient.
- **Do not push agent frameworks everywhere**; keep deterministic pipelines first, LangGraph only where stateful orchestration is necessary.

## Alternatives Considered

| Category          | Recommended          | Alternative                            | Why Not (for current brownfield phase)                               |
| ----------------- | -------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| Backend framework | NestJS 11            | Hono/Fastify-only rewrite              | High migration cost, low immediate feature gain                      |
| AI orchestration  | Targeted LangGraph   | Full custom orchestration from scratch | Reinvents retry/state/human-loop mechanics                           |
| Vector store      | Postgres + pgvector  | Dedicated vector DB from day 1         | Extra infra and ops complexity too early                             |
| AI API surface    | OpenAI Responses API | Chat Completions as primary path       | Responses is newer unified primitive with richer agent/tool patterns |

## Suggested Incremental Adoption (next milestone)

1. Standardize structured output schemas for AI task-generation endpoints.
2. Add retrieval schema/table conventions for pgvector-backed context chunks.
3. Move long-running AI actions to BullMQ workers with idempotency keys.
4. Add end-to-end trace tags from web request → API → AI service → DB write.
5. Add quality gates (golden prompts + regression evals) before enabling broad rollout.

## Confidence Notes

- **HIGH** where recommendation aligns with both current codebase and current official docs/releases (Next.js 16.x, NestJS 11.x, Prisma 7.x, Responses API + Structured Outputs, pgvector capabilities).
- **MEDIUM** where recommendations depend on implementation discipline rather than tool capability alone (LangGraph scope control, eval quality loop, operational governance).

## Sources

- Next.js blog and docs (Next.js 16.x/16.2 status and direction): https://nextjs.org/blog, https://nextjs.org/docs
- NestJS releases and docs (v11 active line): https://github.com/nestjs/nest/releases, https://docs.nestjs.com/
- Prisma releases/docs (v7 active line): https://github.com/prisma/prisma/releases, https://www.prisma.io/docs
- OpenAI API docs (Responses migration + Structured Outputs): https://developers.openai.com/api/docs/overview, https://developers.openai.com/api/docs/guides/migrate-to-responses, https://developers.openai.com/api/docs/guides/structured-outputs
- pgvector official repo/docs (HNSW, IVFFlat, hybrid patterns): https://github.com/pgvector/pgvector
- Supplementary ecosystem context (vector DB tradeoffs, low confidence vs official docs): https://www.pinecone.io/learn/vector-database/, https://supabase.com/docs/guides/ai/vector-columns, https://www.langchain.com/langgraph
