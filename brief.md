# SuperBoard — Project Context (v2)

> Dự án học fullstack toàn diện. Code thật, deploy thật. Không tutorial giả.  
> Mỗi pha có deliverable cụ thể. Hiểu sâu hơn làm nhanh.

---

## Tổng Quan

| | |
|---|---|
| **App** | Nền tảng quản lý dự án real-time — Jira + Notion + Slack gộp lại |
| **Timeline** | 20–24 tuần, part-time 10–15h/tuần |
| **Monorepo** | Turborepo — `apps/web`, `apps/api`, `apps/ai-service`, `packages/shared` |
| **Nguyên tắc** | Mỗi pha build thật, commit thật, có deliverable rõ ràng |

---

## Tech Stack

### Frontend
| Công nghệ | Mục đích |
|---|---|
| Next.js 14 (App Router) | SSR, RSC, Streaming, ISR |
| TypeScript strict | Shared types với backend |
| React Query (TanStack) | Client cache, optimistic updates |
| Zustand | Global UI state |
| Tailwind CSS | Styling |
| Socket.io client | Real-time UI |
| PWA + Service Worker | Offline, installable, push notification |

### Backend
| Công nghệ | Mục đích |
|---|---|
| NestJS | Main API — Guards, Interceptors, Pipes, Filters |
| Prisma | ORM, migrations, type-safe queries |
| Apollo Server | GraphQL endpoint |
| Socket.io server + Redis Adapter | WebSocket multi-instance |
| Pino | Structured JSON logging |

### AI Service (Python — tách riêng)
| Công nghệ | Mục đích |
|---|---|
| Python 3.12 + FastAPI | AI/ML microservice |
| gRPC + protobuf | Communication với NestJS |
| OpenAI / Gemini API | Summarization, chatbot |
| pgvector | Vector embeddings, semantic search |

### Infrastructure
| Công nghệ | Mục đích |
|---|---|
| PostgreSQL 16 | Primary database |
| Redis 7 | Cache, Session, Pub/Sub, Rate limit, Queue |
| Keycloak | Identity Provider, SSO, OAuth2/OIDC, RBAC |
| MinIO → AWS S3 | Object storage |
| Elasticsearch | Full-text search |
| ClickHouse | OLAP analytics |
| Kafka | Event streaming (microservices phase) |
| BullMQ | Job queue — email, notifications, AI jobs |
| Nginx | API Gateway, SSL termination |

### DevOps
| Công nghệ | Mục đích |
|---|---|
| Docker + Compose | Dev environment — postgres, redis, minio, keycloak, mailhog |
| Kubernetes + cert-manager | Production orchestration, SSL tự động |
| GitHub Actions | CI/CD — test → build → push → deploy |
| Prometheus + Grafana | Metrics, alerting |
| OpenTelemetry + Jaeger | Distributed tracing |
| Sentry | Error tracking FE + BE |
| k6 | Load testing |

---

## 13 Pha Học

### Pha 1 — Foundation & Monorepo (1–2 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Turborepo monorepo | Pipeline, caching, parallel tasks |
| TypeScript strict | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| packages/shared | Domain types + Zod schemas dùng chung FE ↔ BE |
| Docker Compose | PostgreSQL, Redis, MinIO, Keycloak, MailHog |
| Distributed ID — ULID | Sortable IDs thay UUID v4, hiểu thêm Snowflake và NanoID |
| Env management | `.env.local` vs `.env.example`, không commit secrets |

**Deliverable:** `npm run dev` → web:3000 + api:4000 start. Docker healthy. TypeScript 0 errors.

---

### Pha 2 — Auth & IAM — Keycloak (2–3 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Keycloak Identity Provider | Realm, Client, SSO, User federation |
| OAuth2 / OIDC + PKCE | Authorization Code flow, token endpoint |
| JWT Access + Refresh Token | Access 15m, Refresh 7d, rotation |
| HTTP-only Cookie | SameSite=Strict, Secure, cookie signing |
| RBAC + ABAC | Owner > Admin > Member > Viewer per workspace |
| NestJS Guards | AuthGuard (validate JWT từ Keycloak JWKS), RolesGuard |
| Silent Token Renewal | Axios interceptor tự refresh khi nhận 401 |
| Rate limiting — Redis | Sliding window 100 req/15min per user |
| MFA / TOTP | Google Authenticator qua Keycloak |
| Audit Log cơ bản | Bảng `audit_logs`, ghi auth events |

**Deliverable:** Login SSO, OAuth Google/GitHub, RBAC guard 403 đúng chỗ, silent refresh hoạt động.

---

### Pha 3 — Core Backend — NestJS (2–3 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| NestJS module structure | Feature modules: workspace, project, task, comment |
| Prisma schema + migrations | Relations, indexes, seed data |
| Multi-tenant RLS | PostgreSQL Row-Level Security, Prisma middleware inject tenant context, AsyncLocalStorage |
| NestJS Interceptors | LoggingInterceptor với correlationId |
| Global Exception Filter | Map mọi lỗi → `ApiResponse<never>` chuẩn |
| ZodValidationPipe | Validate input, field-level error messages |
| GraphQL + DataLoader | Code-first, N+1 prevention |
| REST API + OpenAPI | Versioning `/api/v1`, Swagger auto-generate |
| Database indexing | Composite index, partial index, `EXPLAIN ANALYZE` |
| Connection pooling | PgBouncer hoặc Prisma pool |
| Audit Log Pipeline | Prisma middleware tự bắt writes, JSON diff before/after, async via BullMQ |

**Deliverable:** CRUD đầy đủ, GraphQL playground, Swagger docs, query <10ms với index.

---

### Pha 4 — Frontend — Next.js + PWA (2 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Next.js App Router | Server Components, Streaming, layouts |
| SSR vs CSR strategy | Public pages SSR (SEO), Dashboard CSR |
| React Query | Cache, background refetch, optimistic update khi drag task |
| Zustand store design | UI state, socket state, user preferences |
| Core Web Vitals | LCP <2.5s, FID <100ms, CLS <0.1 |
| PWA Service Worker | Cache-first static, network-first API, offline fallback |
| Web Push Notifications | Subscribe, unsubscribe, server gửi push |

**Deliverable:** Kanban drag-and-drop, app installable, offline page, LCP <2.5s.

---

### Pha 5 — Caching Đa Tầng (1–2 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Cache-aside pattern | Redis + TTL, invalidation khi data thay đổi |
| HTTP Cache Headers | `Cache-Control`, `ETag`, `stale-while-revalidate` |
| CDN — Cloudflare | Edge cache, purge API, cache rules theo URL |
| In-memory LRU cache | Process cache cho hot path (permissions) |
| Cache stampede prevention | Redis distributed lock khi cache miss đồng thời |
| Cache key design | `workspace:{id}:projects`, `user:{id}:permissions:{workspaceId}` |

**Deliverable:** API cache hit <20ms. Hit rate >85%. Stampede không xảy ra.

---

### Pha 6 — Real-time, Events & Jobs (2–3 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Socket.io + Redis Adapter | Rooms theo workspace/project, multi-instance sync |
| Soft Realtime Presence | Redis Sorted Set last-seen, heartbeat 30s, state machine ONLINE/AWAY/OFFLINE, throttled broadcast |
| Server-Sent Events | Live notification feed, nhẹ hơn WebSocket |
| BullMQ Priority Queues | critical / high / normal / low, concurrency khác nhau |
| Rate-limited Worker | Giới hạn OpenAI 10 req/min |
| Cron Jobs | ETL 2AM, cleanup, Stripe usage sync |
| Dead Letter Queue | Jobs fail → DLQ → alert |
| Job Chaining | Upload → process → index (sequential pipeline) |
| Graceful Shutdown | Drain queues trước SIGTERM |
| Domain Events pattern | Typed events, decoupled modules |
| EventEmitter2 in-process | NestJS built-in, same-service events |
| Transactional Outbox | Atomic DB write + event — event không bao giờ mất |
| Event Sourcing | Task history = event log, rebuild state từ events |
| Webhook System | HMAC-SHA256 signing, delivery log, replay, circuit breaker |
| BullBoard UI | Dashboard xem jobs, retry, failed, DLQ |

**Deliverable:** 2 tab sync <200ms, email async, task history đầy đủ, webhook verify được.

---

### Pha 7 — File Storage & Media (1 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| MinIO / S3 | Bucket policy, versioning, lifecycle rules |
| Presigned URL flow | FE xin URL → upload thẳng MinIO → BE confirm |
| Multipart upload | File >5MB, chunked, resume khi gián đoạn |
| Sharp image processing | Resize 3 variants, convert WebP, thumbnail |
| Stream processing | Pipeline không load toàn file vào RAM |
| Storage quota | Track per workspace, enforce khi upload |

**Deliverable:** Presigned URL end-to-end, thumbnail auto-generate, quota enforcement.

---

### Pha 8 — Feature Flag System (1 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Flag store | PostgreSQL + Redis cache TTL 60s |
| Targeting rules | By plan, by workspace ID, by percentage rollout |
| Deterministic hashing | MurmurHash `userId:flagKey` % 100 — cùng user luôn cùng bucket |
| SDK tự viết | Dùng ở NestJS và Next.js Server Components |
| NestJS Decorator | `@FeatureFlag('ai_summary')` guard trên route |
| Admin UI | Toggle, set rules, xem % user đang nhận flag |

**Deliverable:** Toggle flag → Next.js nhận đúng trong <1s. Percentage rollout ổn định.

---

### Pha 9 — Python AI Service + gRPC (2–3 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Python FastAPI | apps/ai-service, Poetry, Dockerfile |
| gRPC + protobuf | .proto schema, bidirectional streaming, NestJS client |
| Task summarization | OpenAI/Gemini, rate limit handling, fallback |
| Semantic search | Embeddings → pgvector → tìm theo nghĩa |
| RAG Chatbot | Index workspace data, Q&A về tasks |
| Async AI via BullMQ | Queue → Python worker → WebSocket kết quả |

**Deliverable:** Summarize task bằng AI, semantic search hoạt động, chatbot trả lời đúng.

---

### Pha 10 — Analytics — ClickHouse + Elasticsearch (1–2 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Elasticsearch | Index tasks/comments, fuzzy search, highlight, autocomplete |
| Search analytics | Track zero-result queries |
| ClickHouse | OLAP, MergeTree, partition by month |
| ETL pipeline | BullMQ cron: PostgreSQL → transform → ClickHouse batch |
| Analytics dashboard | MAU, DAU, task completion rate, workspace growth |

**Deliverable:** Search <100ms, analytics dashboard 30 ngày, ETL chạy 2AM.

---

### Pha 11 — Billing & Subscription — Stripe (2 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Stripe Checkout | Subscription mode, trial 14 ngày |
| Stripe Webhooks | payment_succeeded, payment_failed, subscription_deleted |
| Idempotency | Stripe retry nhiều lần → không process trùng |
| Grace period | 7 ngày PAST_DUE → email nhắc → UNPAID → lock |
| Usage-based billing | Đếm storage, members → sync Stripe metering |
| Invoice portal | Stripe Customer Portal tự manage |
| Plan Guard | `@RequiresPlan('PRO')` decorator |
| Trial logic | 14 ngày → auto-convert hoặc downgrade |

**Deliverable:** Checkout end-to-end, payment failure đúng flow, PRO features lock khi free.

---

### Pha 12 — Multi-Domain (1–2 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Wildcard subdomain | `*.superboard.app` — Nginx regex, tự động theo workspace slug |
| Custom domain | `board.acme.com` — user trỏ CNAME, hệ thống verify |
| cert-manager + ACME | K8s auto-issue SSL per custom domain |
| Next.js middleware (Edge) | Parse hostname → workspaceId → rewrite URL |
| Redis domain cache | `domain:custom:{hostname}` → workspaceId, TTL 5m |
| CORS dynamic | Whitelist từ Redis Set, không hardcode |
| Cookie strategy | Shared `.superboard.app` vs isolated custom domain |
| DNS verification job | BullMQ poll CNAME mỗi 2 phút, state machine PENDING→ACTIVE |
| Keycloak dynamic redirect URIs | Admin API thêm domain mới khi verify |

**Deliverable:** `acme.superboard.app` và `board.acme.com` đều login được, SSL xanh.

---

### Pha 13 — DevOps, Observability & Security (2–3 tuần)
| Kỹ thuật | Ghi chú |
|---|---|
| Docker multi-stage build | Image <150MB, build cache tối ưu |
| Kubernetes manifests | Deployment, HPA, Ingress TLS, ConfigMap, Secret |
| GitHub Actions CI/CD | Test → Build → Push → Rolling deploy <4 phút |
| OpenTelemetry tracing | Traces xuyên NestJS → Redis → PostgreSQL → Python |
| Prometheus + Grafana | Custom metrics, alert khi latency tăng |
| Structured logging Pino | JSON logs, correlationId xuyên request |
| Security hardening | Helmet, HSTS, CSP, OWASP Top 10 |
| k6 load testing | 1000 concurrent users, p95 <500ms, error <1% |
| Secrets management | K8s Secrets, không hardcode trong image |

**Deliverable:** Push code → deploy 4 phút, Grafana đẹp, k6 1000 users không crash.

---

## Kỹ Thuật Xuyên Suốt (Cross-cutting)

Những kỹ thuật này xuất hiện ở nhiều pha, không thuộc riêng pha nào:

| Kỹ thuật | Áp dụng |
|---|---|
| Correlation ID | Mọi request — trace log FE → BE → DB |
| AsyncLocalStorage | Tenant context, user context không truyền tay |
| Optimistic UI | React Query — update trước, rollback nếu fail |
| Type-safe API contract | `packages/shared` — FE ↔ BE ↔ WS events cùng types |
| Health check | `/health` với DB + Redis + queue status |
| Cursor-based pagination | Keyset thay offset cho dataset lớn |
| Database transactions | Atomic ops — outbox, quota update |
| Graceful degradation | Feature lỗi không crash toàn app |

---

## Tổng Số Kỹ Thuật

| Nhóm | Số lượng |
|---|---|
| Frontend | 14 |
| Backend & API | 18 |
| Auth & Security | 10 |
| Database & Storage | 12 |
| Real-time & Events | 15 |
| AI & Search | 8 |
| DevOps & Observability | 12 |
| Business Features (Billing, Flags, Domain) | 22 |
| **Tổng** | **~111 kỹ thuật** |
