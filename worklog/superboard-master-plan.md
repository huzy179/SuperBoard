# SuperBoard — Master Plan (Full Vision)

> **Vision:** Jira + Slack + Notion + AI trong một nền tảng duy nhất.
> Dự án học fullstack toàn diện — code thật, deploy thật, không tutorial giả.

---

## Quy Ước

**Độ ưu tiên:**

- 🔴 P0 — Blocking: không có thì không chạy được
- 🟠 P1 — Core: MVP thực sự dùng được
- 🟡 P2 — Important: nâng tầm đáng kể
- 🟢 P3 — Enhancement: nice to have
- 🔵 P4 — Advanced: kỹ thuật nâng cao, sau khi core ổn

**Trạng thái:** `[ ]` chưa làm · `[~]` đang làm · `[x]` xong

**Nhãn đặc biệt:** `[AI]` tính năng AI · `[RT]` real-time · `[INFRA]` hạ tầng

---

## Tech Stack Đầy Đủ

### Frontend

| Công nghệ              | Mục đích                                   |
| ---------------------- | ------------------------------------------ |
| Next.js 14 App Router  | SSR, RSC, Streaming                        |
| TypeScript strict      | Shared types FE ↔ BE                       |
| React Query (TanStack) | Client cache, optimistic updates           |
| Zustand                | Global UI state                            |
| Tailwind CSS           | Styling                                    |
| Socket.io client       | Real-time sync                             |
| TipTap                 | Block-based rich text editor (Notion-like) |
| Yjs + y-prosemirror    | CRDT collaborative editing                 |
| dnd-kit                | Drag-and-drop Kanban                       |
| cmdk                   | Command palette (Cmd+K)                    |
| PWA + Service Worker   | Offline, installable, push notification    |

### Backend

| Công nghệ                 | Mục đích                                        |
| ------------------------- | ----------------------------------------------- |
| NestJS                    | Main API — Guards, Interceptors, Pipes, Filters |
| Prisma                    | ORM, migrations, type-safe queries              |
| Apollo Server             | GraphQL endpoint                                |
| Socket.io + Redis Adapter | WebSocket multi-instance                        |
| Pino                      | Structured JSON logging                         |

### AI Service (Python)

| Công nghệ             | Mục đích                                           |
| --------------------- | -------------------------------------------------- |
| Python 3.12 + FastAPI | AI/ML microservice                                 |
| gRPC + protobuf       | Communication với NestJS                           |
| OpenAI / Gemini API   | LLM cho mọi tính năng AI                           |
| LangChain             | RAG pipeline, agent orchestration                  |
| pgvector              | Vector embeddings — semantic search toàn workspace |

### Infrastructure

| Công nghệ                                 | Mục đích                                     |
| ----------------------------------------- | -------------------------------------------- |
| PostgreSQL 16                             | Primary database                             |
| Redis 7                                   | Cache, Session, Pub/Sub, Rate limit, Queue   |
| JWT local (hiện tại), Keycloak/OIDC (sau) | Auth theo giai đoạn, ưu tiên ship Jira-first |
| MinIO → AWS S3                            | Object storage                               |
| Elasticsearch                             | Full-text search                             |
| ClickHouse                                | OLAP analytics                               |
| Kafka                                     | Event streaming (microservices)              |
| BullMQ                                    | Job queue — email, notifications, AI jobs    |
| Nginx                                     | API Gateway, SSL                             |

### DevOps

| Công nghệ                 | Mục đích                                       |
| ------------------------- | ---------------------------------------------- |
| Turborepo                 | Monorepo — apps/web, apps/api, apps/ai-service |
| Docker + Compose          | Dev environment                                |
| Kubernetes + cert-manager | Production orchestration                       |
| GitHub Actions            | CI/CD                                          |
| Prometheus + Grafana      | Metrics, alerting                              |
| OpenTelemetry + Jaeger    | Distributed tracing                            |
| Sentry                    | Error tracking                                 |
| k6                        | Load testing                                   |

---

## Cấu Trúc Monorepo

```
superboard/                     ← 1 repo GitHub duy nhất
├── apps/
│   ├── web/                    ← Next.js (Jira + Slack + Notion UI)
│   ├── api/                    ← NestJS (main backend)
│   └── ai-service/             ← Python FastAPI (AI/ML)
├── packages/
│   ├── shared/                 ← Types, Zod schemas, WS events
│   ├── ui/                     ← Shared React components
│   ├── config-ts/              ← tsconfig base/nextjs/node
│   └── config-eslint/          ← ESLint rules
├── infra/
│   ├── k8s/                    ← Kubernetes manifests
│   └── docker/                 ← Dockerfiles
├── .github/workflows/          ← CI/CD
├── turbo.json
├── docker-compose.yml
└── package.json
```

---

## Timeline Tổng Thể

```
Pha 1  — Foundation              Tuần 1–2
Pha 2  — Auth & IAM              Tuần 3–5
Pha 3  — Core Backend + DB       Tuần 6–8
Pha 4  — Jira: Task Management   Tuần 9–12
Pha 5  — Slack: Team Chat        Tuần 13–16
Pha 6  — Notion: Docs & Editor   Tuần 17–21
Pha 7  — AI Integration          Tuần 22–26
Pha 8  — Infrastructure          Tuần 27–30
Pha 9  — Billing & Business      Tuần 31–33
Pha 10 — Production & Scale      Tuần 34–36
```

## Trạng thái thực tế (rolling update)

> Snapshot cập nhật: 2026-03-22

- Jira đã hoàn thiện tới mốc **v1.24** (calendar, task history, robust ordering + rebalance, realtime multi-user drag sync, favorites + recency grouping ở Jira Home).
- Hướng ưu tiên hiện tại: **P1 UX Polish** để nâng trải nghiệm sử dụng hàng ngày.
- Tính năng chuẩn bị triển khai tiếp theo: **Jira v1.25 — Subtasks MVP (nested 1 level + parent progress)**.
- Test integration/E2E vẫn còn trong TODO, nhưng đang ưu tiên nhịp ship feature trước theo định hướng hiện tại.
- Auth runtime hiện tại dùng local JWT; Keycloak/OIDC là hướng mở rộng khi có nhu cầu enterprise rõ ràng.
- `dev:infra` mặc định tập trung Postgres + Redis; các services khác là tuỳ chọn theo integration thật.

---

---

# PHA 1 — FOUNDATION

> Không có phần này thì không thể build bất cứ thứ gì.

## 1.1 Monorepo Setup

- [ ] 🔴 P0 `[INFRA]` Khởi tạo Turborepo: `apps/web`, `apps/api`, `apps/ai-service`, `packages/*`
- [ ] 🔴 P0 `[INFRA]` TypeScript strict mode — base config, nextjs config, node config
- [ ] 🔴 P0 `[INFRA]` `packages/shared`: Domain types (User, Task, Message, Doc...), Zod schemas, API contract `ApiResponse<T>`, WebSocket event types
- [ ] 🔴 P0 `[INFRA]` ESLint + Prettier shared config, Husky pre-commit, lint-staged
- [ ] 🔴 P0 `[INFRA]` Env management — `.env.local` per app, `.env.example` committed, Zod validation khi startup

## 1.2 Docker Dev Environment

- [ ] 🔴 P0 `[INFRA]` Docker Compose: PostgreSQL 16 + Redis 7 (mặc định), full stack mở rộng khi có integration thật
- [ ] 🔴 P0 `[INFRA]` Health check cho tất cả containers
- [ ] 🟠 P1 `[INFRA]` Seed script: tạo data mẫu cho development
- [ ] 🟠 P1 `[INFRA]` Makefile hoặc scripts: `make dev`, `make db-reset`, `make seed`

## 1.3 CI/CD Skeleton

- [ ] 🔴 P0 `[INFRA]` GitHub Actions CI: typecheck + lint + test chạy mỗi PR
- [ ] 🟠 P1 `[INFRA]` GitHub Actions CD: deploy per app với `paths` filter (chỉ rebuild app bị thay đổi)

## 1.4 Shared Foundation

- [ ] 🟠 P1 `[INFRA]` ULID generator trong `packages/shared` — thay UUID v4, sortable
- [ ] 🟠 P1 `[INFRA]` Health check API `GET /api/v1/health` — status DB, Redis, queue
- [ ] 🟠 P1 `[INFRA]` Pino structured logging với correlationId tự động inject

**Deliverable:** `npm run dev` → web:3000 + api:4000 start. Docker healthy. TypeScript 0 errors.

---

---

# PHA 2 — AUTH & IAM

> Cổng vào của toàn bộ hệ thống.

## 2.1 JWT-first Setup

- [ ] 🔴 P0 Login nội bộ bằng JWT (email/password), giữ flow đơn giản để ship Jira nhanh
- [ ] 🔴 P0 Roles cơ bản: `workspace-owner`, `workspace-admin`, `workspace-member`, `workspace-viewer`
- [ ] 🟠 P1 Tách rõ auth config cho current (`JWT_*`) và future (`OIDC_*`) để tránh nhầm lẫn

## 2.2 Login / Register

- [ ] 🔴 P0 Lưu Refresh Token trong HTTP-only cookie (`Secure; SameSite=Strict`)
- [ ] 🟠 P1 Đăng ký tài khoản → email verify → active
- [ ] 🟠 P1 Quên mật khẩu → reset flow nội bộ (hoặc provider khi cần)
- [ ] 🟡 P2 OIDC/SSO (Keycloak hoặc provider tương đương) khi có nhu cầu enterprise
- [ ] 🟡 P2 OAuth Social Login — Google/GitHub

## 2.3 Token Management

- [ ] 🟠 P1 Access Token 15 phút, Refresh Token 7 ngày
- [ ] 🟠 P1 Silent Token Renewal — Axios interceptor tự refresh khi 401 rồi retry
- [ ] 🟠 P1 Đăng xuất — xóa cookie + invalidate session/refresh token
- [ ] 🟡 P2 Session management UI — xem danh sách device đang active, revoke từng phiên

## 2.4 Authorization

- [ ] 🟠 P1 NestJS `AuthGuard` — validate JWT, inject `req.user`
- [ ] 🟠 P1 NestJS `RolesGuard` — RBAC per workspace
- [ ] 🟡 P2 ABAC fine-grained — check quyền theo resource (chỉ creator/admin xóa được)
- [ ] 🟡 P2 `@CurrentUser()`, `@Roles()`, `@RequiresPlan()` decorators

## 2.5 Security

- [ ] 🟠 P1 Rate limiting — Redis sliding window: login 10/min, API 100/15min
- [ ] 🟡 P2 MFA / TOTP (provider-agnostic)
- [ ] 🟡 P2 Brute force protection — block IP sau 10 fail/15min
- [ ] 🟢 P3 API Keys — long-lived key cho external integration, hash SHA-256 trước khi lưu

## 2.6 Audit Log Auth

- [ ] 🟠 P1 Ghi `audit_logs` cho mọi auth event: login, logout, failed login, token refresh

**Deliverable:** Login JWT-first ổn định, RBAC guard 403 đúng chỗ, silent refresh hoạt động; OIDC/SSO để pha sau.

---

---

# PHA 3 — CORE BACKEND & DATABASE

> Nền móng data layer cho toàn bộ 3 sản phẩm (Jira + Slack + Notion).

## 3.1 Prisma Schema — Toàn Bộ

- [ ] 🔴 P0 `User` — externalAuthId (optional), name, email, avatarUrl, preferences
- [ ] 🔴 P0 `Workspace` — slug, plan, storageUsed, storageQuota
- [ ] 🔴 P0 `WorkspaceMember` — userId, workspaceId, role
- [ ] 🔴 P0 `Project` — workspaceId, name, color, isArchived
- [ ] 🔴 P0 `Task` — projectId, title, description, status, priority, assigneeId, position, dueDate, parentId
- [ ] 🔴 P0 `TaskEvent` — event sourcing cho task history
- [ ] 🔴 P0 `Comment` — taskId hoặc messageId hoặc docId, authorId, content
- [ ] 🔴 P0 `Channel` — workspaceId, name, type (PUBLIC/PRIVATE/DM)
- [ ] 🔴 P0 `ChannelMember` — channelId, userId, lastReadAt
- [ ] 🔴 P0 `Message` — channelId, authorId, content, threadId, editedAt, deletedAt
- [ ] 🔴 P0 `MessageReaction` — messageId, userId, emoji
- [ ] 🔴 P0 `Doc` — workspaceId, title, parentDocId (tree), createdById, content (TipTap JSON)
- [ ] 🔴 P0 `DocVersion` — docId, content snapshot, savedAt (version history)
- [ ] 🔴 P0 `Attachment` — key (MinIO), url, size, mimeType, taskId/messageId/docId
- [ ] 🔴 P0 `Notification` — userId, type, payload, readAt
- [ ] 🟠 P1 `AuditLog` — model, action, before/after JSON diff, userId, ip
- [ ] 🟠 P1 `OutboxEvent` — transactional outbox pattern
- [ ] 🟠 P1 `FeatureFlag` — key, enabled, rules JSON
- [ ] 🟠 P1 `WebhookEndpoint` + `WebhookDelivery`
- [ ] 🟡 P2 `Subscription` + `Invoice` — Stripe data
- [ ] 🟡 P2 `ApiKey` — hashed, prefix, workspaceId

## 3.2 Multi-tenant

- [ ] 🔴 P0 PostgreSQL Row-Level Security trên tất cả bảng có `workspace_id`
- [ ] 🔴 P0 Prisma `$use()` middleware inject `app.current_workspace_id` qua AsyncLocalStorage
- [ ] 🟠 P1 `TenantMiddleware` trong NestJS — extract workspaceId từ request, set vào storage

## 3.3 NestJS Architecture

- [ ] 🔴 P0 Module structure: `AuthModule`, `WorkspaceModule`, `ProjectModule`, `TaskModule`, `ChatModule`, `DocModule`, `NotificationModule`, `UploadModule`, `SearchModule`
- [ ] 🔴 P0 `GlobalExceptionFilter` — map mọi lỗi → `ApiResponse<never>` chuẩn
- [ ] 🔴 P0 `LoggingInterceptor` — log mọi request với correlationId, duration, userId
- [ ] 🔴 P0 `ZodValidationPipe` — validate input, field-level errors
- [ ] 🟠 P1 `TransformInterceptor` — chuẩn hóa mọi response thành `ApiResponse<T>`
- [ ] 🟠 P1 REST API versioning `/api/v1` + Swagger auto-generate
- [ ] 🟠 P1 GraphQL + Apollo Server + DataLoader (N+1 prevention)
- [ ] 🟠 P1 Database indexes: composite, partial — test với `EXPLAIN ANALYZE`
- [ ] 🟡 P2 Connection pooling (PgBouncer)

## 3.4 Audit Log Pipeline

- [ ] 🟡 P2 Prisma middleware tự bắt mọi write — không viết tay từng chỗ
- [ ] 🟡 P2 Compute JSON diff before/after
- [ ] 🟡 P2 Ghi async qua BullMQ queue `low` — không block request

## 3.5 Event System

- [ ] 🟠 P1 Typed Domain Events trong `packages/shared`: `TaskCreated`, `MessageSent`, `DocUpdated`...
- [ ] 🟠 P1 EventEmitter2 in-process — decoupled modules
- [ ] 🟡 P2 Transactional Outbox — DB write + event trong cùng transaction, poller publish

**Deliverable:** Toàn bộ schema migrate OK. CRUD cơ bản cho tất cả entities. RLS hoạt động.

---

---

# PHA 4 — JIRA: TASK MANAGEMENT

> Trái tim của sản phẩm về quản lý công việc.

## 4.1 Projects

- [ ] 🔴 P0 CRUD Project — name, description, color, icon
- [ ] 🟠 P1 Archive / restore project (soft delete)
- [ ] 🟡 P2 Project settings — đổi tên, màu, members riêng

## 4.2 Tasks — Core

- [ ] 🔴 P0 CRUD Task — title, description (markdown), status, priority, dueDate
- [ ] 🔴 P0 Task assignee — assign cho member, hiện avatar
- [ ] 🔴 P0 Task status: `TODO → IN_PROGRESS → IN_REVIEW → DONE → CANCELLED`
- [ ] 🔴 P0 Task priority: `LOW / MEDIUM / HIGH / URGENT`
- [ ] 🟠 P1 Task position (fractional indexing) — drag order trong column
- [ ] 🟠 P1 Task labels/tags — tạo tag màu per workspace, gán nhiều tags
- [ ] 🟡 P2 Subtasks — nested 1 level, parent hiện progress bar
- [ ] 🟡 P2 Task dependencies — A "blocks" B, warn khi done task bị block
- [ ] 🟢 P3 Recurring tasks — lặp lại daily/weekly/monthly
- [ ] 🟢 P3 Task templates — lưu và tạo từ template
- [ ] 🔵 P4 Custom fields — workspace tự thêm field: number, text, select, date

## 4.3 Views

- [ ] 🔴 P0 Kanban Board — columns theo status, drag-and-drop task
- [ ] 🟠 P1 List view — table với sort, filter, column toggle
- [ ] 🟠 P1 Task detail modal/page — đầy đủ info, comments, attachments, history
- [ ] 🟡 P2 Calendar view — tasks theo month/week, filter by assignee
- [ ] 🟢 P3 Timeline / Gantt view — tasks theo dueDate
- [ ] 🔵 P4 Spreadsheet view — edit inline như Excel

## 4.4 Filtering & Search

- [ ] 🟠 P1 Filter tasks: by status, priority, assignee, label, due date, project
- [ ] 🟠 P1 Sort tasks: by dueDate, priority, createdAt, position
- [ ] 🟠 P1 Full-text search trong tasks (Elasticsearch)
- [ ] 🟡 P2 Saved filters — lưu filter thường dùng
- [ ] 🟡 P2 My tasks view — tất cả task được assign cho mình across workspaces

## 4.5 Bulk Actions

- [ ] 🟡 P2 Select nhiều tasks → đổi status / assignee / priority / labels
- [ ] 🟡 P2 Move tasks sang project khác

## 4.6 Real-time

- [ ] 🔴 P0 `[RT]` Task update realtime — kéo task → tất cả người xem cùng board thấy ngay
- [ ] 🟠 P1 `[RT]` Presence trên board — hiện avatar ai đang xem board này

## 4.7 AI trên Tasks

- [ ] 🟡 P2 `[AI]` Summarize task — nút "Tóm tắt" → AI tóm tắt description dài
- [ ] 🟡 P2 `[AI]` Auto-suggest priority — AI đề xuất priority dựa vào title + description
- [ ] 🟡 P2 `[AI]` Auto-suggest assignee — AI gợi ý người phù hợp nhất dựa theo lịch sử
- [ ] 🟡 P2 `[AI]` Auto-tagging — phân tích nội dung → gợi ý tags
- [ ] 🔵 P4 `[AI]` Break down task — AI chia task lớn thành subtasks
- [ ] 🔵 P4 `[AI]` Estimate effort — AI ước tính thời gian dựa theo subtask tương tự

## 4.8 Notifications từ Tasks

- [ ] 🟠 P1 Notify khi được assign task
- [ ] 🟠 P1 Notify khi task được mention mình trong comment
- [ ] 🟡 P2 Notify khi task sắp đến hạn (24h trước)
- [ ] 🟡 P2 Notify khi task overdue

**Deliverable:** Kanban drag-and-drop hoạt động, real-time sync 2 tab, AI summarize task.

---

---

# PHA 5 — SLACK: TEAM CHAT

> Giao tiếp nội bộ ngay trong workspace — không cần chuyển sang Slack.

## 5.1 Channels

- [ ] 🔴 P0 Tạo channel (PUBLIC / PRIVATE) — name, description
- [ ] 🔴 P0 Join / leave channel
- [ ] 🟠 P1 Channel list trong sidebar — sort by last activity
- [ ] 🟠 P1 #general channel tự tạo khi workspace được khởi tạo
- [ ] 🟡 P2 Channel settings — đổi tên, description, archive
- [ ] 🟡 P2 Channel members management (PRIVATE channels)

## 5.2 Direct Messages

- [ ] 🟠 P1 DM 1-1 giữa hai members
- [ ] 🟡 P2 Group DM — nhiều người (không phải channel)

## 5.3 Messages — Core

- [ ] 🔴 P0 Gửi tin nhắn text
- [ ] 🔴 P0 `[RT]` Real-time delivery — tin nhắn hiện ngay cho tất cả trong channel
- [ ] 🟠 P1 Cursor-based pagination — load tin nhắn cũ khi scroll lên
- [ ] 🟠 P1 Sửa tin nhắn (hiện "edited" label)
- [ ] 🟠 P1 Xóa tin nhắn (soft delete, hiện "This message was deleted")
- [ ] 🟠 P1 Thread replies — reply vào một tin nhắn, tạo thread riêng
- [ ] 🟠 P1 Markdown trong tin nhắn — **bold**, `code`, > quote, `code block`
- [ ] 🟡 P2 Emoji reactions — click emoji, count realtime
- [ ] 🟡 P2 Pin message trong channel
- [ ] 🟡 P2 Copy link đến message cụ thể

## 5.4 Read / Unread

- [ ] 🟠 P1 Track `lastReadAt` per user per channel
- [ ] 🟠 P1 Unread count badge trên channel name
- [ ] 🟠 P1 Mark as read khi scroll đến cuối
- [ ] 🟡 P2 "Jump to unread" button

## 5.5 Mentions & Notifications

- [ ] 🟠 P1 @mention member trong channel — highlight + notify
- [ ] 🟠 P1 @here — notify tất cả members đang online
- [ ] 🟠 P1 Notify khi được mention hoặc DM
- [ ] 🟡 P2 Notification preferences per channel

## 5.6 File Sharing

- [ ] 🟠 P1 Upload file / ảnh vào chat — presigned URL, preview inline
- [ ] 🟡 P2 Drag-and-drop file vào chat box
- [ ] 🟡 P2 File browser — xem tất cả files đã share trong channel

## 5.7 Presence & Typing

- [ ] 🟡 P2 `[RT]` Online / Away / Offline indicator
- [ ] 🟡 P2 `[RT]` "User đang nhập..." indicator (typing indicator)

## 5.8 AI trên Chat

- [ ] 🟡 P2 `[AI]` Summarize channel — "Tóm tắt 50 tin nhắn vừa rồi"
- [ ] 🟡 P2 `[AI]` Extract action items — AI đọc thread → tạo tasks tự động
- [ ] 🔵 P4 `[AI]` Smart search trong chat — tìm theo ngữ nghĩa, không chỉ keyword
- [ ] 🔵 P4 `[AI]` AI reply suggestion — gợi ý câu trả lời dựa vào context

## 5.9 Integrations

- [ ] 🟢 P3 Link preview — URL trong chat hiện preview card (title, description, image)
- [ ] 🟢 P3 Embed task vào chat — gõ `#TASK-123` hiện card task inline
- [ ] 🟢 P3 Embed doc vào chat — gõ `/doc` để link đến doc

**Deliverable:** Gửi/nhận tin nhắn realtime, thread, unread tracking, @mention notify.

---

---

# PHA 6 — NOTION: DOCS & EDITOR

> Workspace knowledge base — viết, tổ chức, chia sẻ tài liệu.

## 6.1 Document Tree

- [ ] 🔴 P0 CRUD Doc — title, parentDocId (tree structure), workspaceId
- [ ] 🔴 P0 Sidebar hiện cây document có thể collapse/expand
- [ ] 🟠 P1 Drag-and-drop để reorder và di chuyển doc trong tree
- [ ] 🟠 P1 Nested docs không giới hạn độ sâu
- [ ] 🟡 P2 Breadcrumb navigation — hiện đường dẫn đến doc hiện tại
- [ ] 🟡 P2 Doc quick switcher (Cmd+K)
- [ ] 🟡 P2 Favorite / pin docs
- [ ] 🟡 P2 Archive doc (soft delete, restore được)

## 6.2 Block Editor (TipTap)

- [ ] 🔴 P0 Setup TipTap editor với basic extensions
- [ ] 🔴 P0 Block types: Paragraph, Heading (H1/H2/H3), Bullet list, Numbered list, Todo (checkbox)
- [ ] 🔴 P0 Inline formatting: **Bold**, _Italic_, `Code`, ~~Strikethrough~~, [Link]
- [ ] 🟠 P1 Code block với syntax highlight (Prism.js)
- [ ] 🟠 P1 Block quote
- [ ] 🟠 P1 Horizontal rule
- [ ] 🟠 P1 Slash commands `/` — mở menu chọn block type
- [ ] 🟠 P1 Drag handle — drag để reorder blocks
- [ ] 🟡 P2 Table block — insert, resize columns, add/remove rows
- [ ] 🟡 P2 Image block — upload hoặc embed URL, resize
- [ ] 🟡 P2 Embed block — YouTube, Figma, GitHub Gist
- [ ] 🟡 P2 Callout block — info/warning/error box
- [ ] 🟡 P2 Toggle / Accordion block
- [ ] 🟡 P2 Divider block
- [ ] 🟢 P3 Mention block — link đến user, task, doc
- [ ] 🟢 P3 Math block (KaTeX)
- [ ] 🟢 P3 Mermaid diagram block
- [ ] 🔵 P4 Database block (mini-Notion database)

## 6.3 Auto-save

- [ ] 🔴 P0 Auto-save khi editor idle 2 giây (debounce)
- [ ] 🟠 P1 "Saving..." / "Saved" indicator
- [ ] 🟠 P1 Lưu TipTap JSON format vào DB — không lưu HTML raw

## 6.4 Version History

- [ ] 🟡 P2 Tự động snapshot mỗi 30 phút và mỗi khi save
- [ ] 🟡 P2 UI xem lịch sử versions — timeline theo thời gian
- [ ] 🟡 P2 Preview version cũ — side-by-side diff
- [ ] 🟡 P2 Restore về version cũ

## 6.5 Collaborative Editing

- [ ] 🟡 P2 `[RT]` Yjs CRDT document state — nhiều người cùng edit không conflict
- [ ] 🟡 P2 `[RT]` y-websocket server — sync Yjs document qua WebSocket
- [ ] 🟡 P2 `[RT]` Hiện cursor của người khác đang edit (tên + màu)
- [ ] 🟡 P2 `[RT]` Presence avatars trên editor — ai đang xem doc này

## 6.6 Sharing & Permissions

- [ ] 🟠 P1 Permission per doc: owner, editor, viewer
- [ ] 🟡 P2 Share link public (read-only, không cần login)
- [ ] 🟡 P2 Comment trên doc (inline comment, anchor vào đoạn text cụ thể)
- [ ] 🟢 P3 Export doc sang Markdown
- [ ] 🟢 P3 Export doc sang PDF

## 6.7 AI trên Docs

- [ ] 🟡 P2 `[AI]` "Continue writing" — AI tiếp tục đoạn văn từ cursor
- [ ] 🟡 P2 `[AI]` Summarize doc — tóm tắt doc thành bullet points
- [ ] 🟡 P2 `[AI]` Improve writing — rewrite đoạn được chọn cho rõ ràng hơn
- [ ] 🟡 P2 `[AI]` Change tone — formal / casual / concise
- [ ] 🔵 P4 `[AI]` Extract action items từ doc → tạo tasks
- [ ] 🔵 P4 `[AI]` Generate doc từ prompt — "Viết PRD cho feature X"
- [ ] 🔵 P4 `[AI]` Ask doc — "Doc này nói gì về authentication?"

**Deliverable:** Viết doc với TipTap, slash commands, auto-save, collaborative editing, AI writing assistant.

---

---

# PHA 7 — AI INTEGRATION

> AI xuyên suốt toàn bộ workspace — không phải addon, là core feature.

## 7.1 Python AI Service

- [ ] 🟠 P1 FastAPI app setup — Poetry, uvicorn, Dockerfile, healthcheck
- [ ] 🟠 P1 gRPC server tại port 50051 — `.proto` file cho tất cả AI services
- [ ] 🟠 P1 NestJS gRPC client — kết nối và gọi Python service
- [ ] 🟠 P1 Rate limiting per user cho AI calls — không để user spam tốn tiền API
- [ ] 🟠 P1 AI jobs qua BullMQ — tất cả AI call đều async, không block HTTP request

## 7.2 Semantic Search

- [ ] 🟡 P2 `[AI]` Tự động generate embedding khi tạo/update Task, Message, Doc
- [ ] 🟡 P2 `[AI]` Lưu vectors vào pgvector (PostgreSQL extension)
- [ ] 🟡 P2 `[AI]` Semantic search API — tìm kiếm theo ngữ nghĩa trên toàn workspace
- [ ] 🔵 P4 `[AI]` Hybrid search — kết hợp full-text (Elasticsearch) + semantic (pgvector)

## 7.3 RAG Chatbot — SuperBoard AI Assistant

- [ ] 🟡 P2 `[AI]` Index toàn bộ workspace data: tasks, messages, docs vào vector store
- [ ] 🟡 P2 `[AI]` RAG pipeline: user hỏi → retrieve relevant context → LLM trả lời
- [ ] 🟡 P2 `[AI]` Floating AI chat button trong UI
- [ ] 🟡 P2 `[AI]` Chatbot biết trả lời: "Task nào đang overdue?", "Ai đang làm feature X?", "Tóm tắt doc Y"
- [ ] 🟡 P2 `[AI]` Streaming response — hiện từng chữ như ChatGPT
- [ ] 🔵 P4 `[AI]` Chatbot có thể tạo task, gửi message, cập nhật doc theo lệnh

## 7.4 AI trên Tasks (từ Pha 4)

- [ ] 🟡 P2 `[AI]` Summarize task description
- [ ] 🟡 P2 `[AI]` Auto-suggest priority, assignee, tags
- [ ] 🔵 P4 `[AI]` Break down task thành subtasks
- [ ] 🔵 P4 `[AI]` Effort estimation

## 7.5 AI trên Chat (từ Pha 5)

- [ ] 🟡 P2 `[AI]` Summarize channel history
- [ ] 🟡 P2 `[AI]` Extract action items từ thread → tạo tasks
- [ ] 🔵 P4 `[AI]` Smart search trong chat

## 7.6 AI trên Docs (từ Pha 6)

- [ ] 🟡 P2 `[AI]` Continue writing, summarize, improve
- [ ] 🟡 P2 `[AI]` Change tone
- [ ] 🔵 P4 `[AI]` Generate doc từ prompt
- [ ] 🔵 P4 `[AI]` Ask doc (Q&A trên nội dung doc)

## 7.7 AI Analytics

- [ ] 🔵 P4 `[AI]` Productivity insights — AI phân tích pattern làm việc của team
- [ ] 🔵 P4 `[AI]` Sprint retrospective — AI tổng kết sprint từ task history
- [ ] 🔵 P4 `[AI]` Bottleneck detection — phát hiện task bị stuck, suggest action

**Deliverable:** Semantic search toàn workspace, AI chatbot trả lời câu hỏi về workspace, AI writing trong docs.

---

---

# PHA 8 — INFRASTRUCTURE & PLATFORM

> Từ "chạy được" lên "chạy production-grade".

## 8.1 Caching

- [ ] 🟠 P1 Redis cache-aside — projects, permissions, workspace config
- [ ] 🟠 P1 Cache invalidation đúng khi data thay đổi
- [ ] 🟠 P1 React Query client cache — staleTime, prefetch khi hover
- [ ] 🟡 P2 HTTP Cache Headers — ETag, stale-while-revalidate
- [ ] 🟡 P2 Cache stampede prevention — Redis distributed lock
- [ ] 🟢 P3 CDN — Cloudflare edge cache

## 8.2 Background Jobs (BullMQ)

- [ ] 🔴 P0 Email queue `high` — tất cả email đều async
- [ ] 🟠 P1 Priority queues: critical / high / normal / low
- [ ] 🟠 P1 Retry với exponential backoff (2s → 4s → 8s → 16s → 32s)
- [ ] 🟠 P1 Graceful shutdown — drain queues trước SIGTERM
- [ ] 🟡 P2 Rate-limited workers — OpenAI 10 req/min, Stripe 100 req/min
- [ ] 🟡 P2 Cron jobs: ETL 2AM, cleanup audit logs hàng tuần, due date reminders
- [ ] 🟡 P2 Dead Letter Queue + alert khi DLQ có jobs
- [ ] 🟡 P2 Job chaining: upload → process image → index search
- [ ] 🟡 P2 BullBoard UI `/admin/queues`

## 8.3 File Storage

- [ ] 🟠 P1 Presigned URL upload — FE upload thẳng lên MinIO, không qua server
- [ ] 🟠 P1 Presigned URL download — TTL 1 giờ
- [ ] 🟠 P1 File type validation — magic bytes, whitelist MIME types
- [ ] 🟡 P2 Image processing — resize 3 variants, convert WebP (Sharp)
- [ ] 🟡 P2 Multipart upload cho file >5MB
- [ ] 🟡 P2 Storage quota enforcement — 5GB FREE, 50GB PRO
- [ ] 🟢 P3 Virus scan (ClamAV) trước khi confirm

## 8.4 Real-time Infrastructure

- [ ] 🔴 P0 Socket.io server + Redis Adapter (multi-instance support)
- [ ] 🟠 P1 Rooms: `workspace:{id}`, `project:{id}`, `channel:{id}`, `doc:{id}`
- [ ] 🟡 P2 Soft Realtime Presence — Redis Sorted Set, heartbeat 30s, ONLINE/AWAY/OFFLINE
- [ ] 🟡 P2 Typing indicators cho Chat
- [ ] 🟡 P2 Server-Sent Events — lightweight notification stream

## 8.5 Search

- [ ] 🟠 P1 Elasticsearch index: tasks, messages, docs
- [ ] 🟠 P1 Full-text search với fuzzy match + highlight
- [ ] 🟡 P2 Autocomplete suggestions
- [ ] 🟡 P2 Filter results (by type, project, date range, author)
- [ ] 🟡 P2 Global search UI — Cmd+K command palette
- [ ] 🔵 P4 Search analytics — track zero-result queries

## 8.6 Feature Flags

- [ ] 🟡 P2 Flag store — PostgreSQL + Redis cache 60s
- [ ] 🟡 P2 On/Off toggle global
- [ ] 🟡 P2 Targeting: by plan, by workspace ID
- [ ] 🟢 P3 Percentage rollout — deterministic MurmurHash
- [ ] 🟢 P3 Admin UI quản lý flags

## 8.7 Webhook System

- [ ] 🟡 P2 CRUD webhook endpoints
- [ ] 🟡 P2 HMAC-SHA256 signing
- [ ] 🟡 P2 Delivery log + retry exponential backoff
- [ ] 🟡 P2 Circuit breaker — disable sau 5 lần fail
- [ ] 🟢 P3 Replay delivery từ UI
- [ ] 🟢 P3 Webhook test button

## 8.8 Notifications

- [ ] 🟠 P1 In-app notifications — bell icon, unread count
- [ ] 🟠 P1 Real-time notification delivery (Socket.io / SSE)
- [ ] 🟠 P1 Email notifications — async via BullMQ
- [ ] 🟡 P2 Notification preferences per user per type
- [ ] 🟡 P2 Push notifications (PWA Web Push API)
- [ ] 🟡 P2 Due date reminder — delayed BullMQ job
- [ ] 🟢 P3 Digest email — gom notification → 1 email cuối ngày

## 8.9 PWA

- [ ] 🟡 P2 Web App Manifest — icons, standalone display
- [ ] 🟡 P2 Service Worker — cache-first static, network-first API
- [ ] 🟡 P2 Install prompt
- [ ] 🟡 P2 Offline indicator + offline fallback page
- [ ] 🟡 P2 Push notifications qua Service Worker

**Deliverable:** Cache hit rate >85%, job queue ổn định, search <100ms, PWA installable.

---

---

# PHA 9 — BILLING & BUSINESS FEATURES

## 9.1 Billing — Stripe

- [ ] 🟡 P2 Stripe Checkout — subscription mode, trial 14 ngày
- [ ] 🟡 P2 Stripe Webhook handler + idempotency (Stripe retry nhiều lần)
- [ ] 🟡 P2 Payment failure → grace period 7 ngày → lock features
- [ ] 🟡 P2 Plan gating — `@RequiresPlan('PRO')` decorator
- [ ] 🟡 P2 Free plan limits: 5 members, 3 projects, 5GB, 90 ngày audit log
- [ ] 🟢 P3 Stripe Customer Portal — tự manage subscription
- [ ] 🟢 P3 Upgrade / downgrade flow
- [ ] 🔵 P4 Usage metering — storage + members → Stripe

## 9.2 Multi-Domain (White-label)

- [ ] 🟢 P3 Wildcard subdomain `*.superboard.app` — tự tạo theo workspace slug
- [ ] 🟢 P3 Next.js Edge middleware — parse hostname → workspaceId → rewrite URL
- [ ] 🟢 P3 Redis domain cache — TTL 5 phút
- [ ] 🟢 P3 Custom domain input + DNS verification job (BullMQ poll CNAME)
- [ ] 🟢 P3 Dynamic CORS từ Redis Set
- [ ] 🔵 P4 cert-manager K8s — auto-issue SSL cho custom domains

## 9.3 Analytics

- [ ] 🔵 P4 ClickHouse — OLAP, track user events
- [ ] 🔵 P4 ETL pipeline — BullMQ cron: PostgreSQL → ClickHouse hàng đêm
- [ ] 🔵 P4 Admin analytics dashboard — MAU, DAU, task completion rate

**Deliverable:** Stripe checkout end-to-end, plan gating hoạt động, subdomain tự tạo.

---

---

# PHA 10 — PRODUCTION & SCALE

## 10.1 Observability

- [ ] 🟠 P1 Sentry error tracking — FE + BE, source maps
- [ ] 🟡 P2 OpenTelemetry distributed tracing — qua NestJS → Redis → DB → Python
- [ ] 🟡 P2 Prometheus custom metrics + Grafana dashboards
- [ ] 🟡 P2 Alert rules — p95 latency >1s, error rate >5%, DLQ có jobs
- [ ] 🟢 P3 Elasticsearch log aggregation

## 10.2 Docker & Kubernetes

- [ ] 🟠 P1 Docker multi-stage build — NestJS <150MB, Next.js <200MB
- [ ] 🟡 P2 K8s Deployment, Service, Ingress TLS
- [ ] 🟡 P2 HPA — auto-scale theo CPU/memory
- [ ] 🟡 P2 ConfigMap + Secret (không hardcode trong image)
- [ ] 🟡 P2 Rolling update, rollback

## 10.3 CI/CD Full Pipeline

- [ ] 🟠 P1 GitHub Actions: typecheck → lint → test → build Docker → push → deploy
- [ ] 🟠 P1 Paths filter — chỉ rebuild app bị thay đổi
- [ ] 🟠 P1 `npm audit` — block merge nếu có critical vulnerability
- [ ] 🟡 P2 Staging environment — deploy preview cho mọi PR
- [ ] 🟢 P3 Dependabot — auto PR khi có package update

## 10.4 Security Hardening

- [ ] 🟠 P1 Helmet.js — HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- [ ] 🟠 P1 OWASP Top 10 checklist — SQL injection, XSS, IDOR, Mass Assignment
- [ ] 🟡 P2 Security headers scan (securityheaders.com)
- [ ] 🟢 P3 Database backup hàng ngày sang S3, test restore hàng tuần

## 10.5 Performance

- [ ] 🟡 P2 k6 load test — 1000 concurrent users, p95 <500ms, error <1%
- [ ] 🟡 P2 Core Web Vitals — LCP <2.5s, FID <100ms, CLS <0.1
- [ ] 🟡 P2 Database query optimization — N+1 check, slow query log
- [ ] 🟡 P2 Bundle size analysis — next/bundle-analyzer

**Deliverable:** Push code → deploy trong 4 phút, Grafana đẹp, k6 1000 users không crash.

---

---

## Tổng Hợp

### Số lượng tính năng

| Module             | P0     | P1     | P2     | P3     | P4     | Tổng    |
| ------------------ | ------ | ------ | ------ | ------ | ------ | ------- |
| Foundation         | 8      | 5      | 0      | 0      | 0      | 13      |
| Auth & IAM         | 8      | 9      | 5      | 1      | 0      | 23      |
| Core Backend       | 12     | 8      | 3      | 0      | 0      | 23      |
| Jira: Tasks        | 8      | 9      | 8      | 3      | 4      | 32      |
| Slack: Chat        | 5      | 9      | 8      | 3      | 2      | 27      |
| Notion: Docs       | 4      | 7      | 12     | 4      | 4      | 31      |
| AI Integration     | 0      | 5      | 14     | 0      | 7      | 26      |
| Infrastructure     | 2      | 14     | 22     | 5      | 2      | 45      |
| Billing & Business | 0      | 0      | 8      | 5      | 3      | 16      |
| Production & Scale | 0      | 7      | 12     | 3      | 0      | 22      |
| **Tổng**           | **47** | **73** | **92** | **24** | **22** | **258** |

### Timeline

| Pha | Nội dung                  | Tuần  |
| --- | ------------------------- | ----- |
| 1   | Foundation                | 1–2   |
| 2   | Auth & IAM                | 3–5   |
| 3   | Core Backend              | 6–8   |
| 4   | Jira: Task Management     | 9–12  |
| 5   | Slack: Team Chat          | 13–16 |
| 6   | Notion: Docs & Editor     | 17–21 |
| 7   | AI Integration            | 22–26 |
| 8   | Infrastructure & Platform | 27–30 |
| 9   | Billing & Business        | 31–33 |
| 10  | Production & Scale        | 34–36 |

**Tổng: ~36 tuần (9 tháng) học part-time 10–15h/tuần**

### Thư Viện Quan Trọng Cần Chú Ý

| Nhóm          | Thư viện chính                                                         |
| ------------- | ---------------------------------------------------------------------- |
| Editor        | `tiptap`, `@tiptap/extension-*`, `yjs`, `y-prosemirror`, `y-websocket` |
| Drag & Drop   | `@dnd-kit/core`, `@dnd-kit/sortable`                                   |
| Auth          | `openid-client`, `jose`, `@nestjs/passport`, `passport-jwt`            |
| Queue         | `bullmq`, `@bull-board/api`                                            |
| Cache         | `ioredis`, `lru-cache`                                                 |
| Storage       | `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `sharp`         |
| Real-time     | `socket.io`, `socket.io-client`, `@socket.io/redis-adapter`            |
| AI            | `openai`, `langchain`, `pgvector`, `grpc-js`, `grpcio`                 |
| Observability | `pino`, `@opentelemetry/sdk-node`, `prom-client`, `@sentry/node`       |
| Billing       | `stripe`                                                               |
| Validation    | `zod`, `nestjs-zod`                                                    |
| Testing       | `jest`, `@nestjs/testing`, `supertest`, `k6`                           |
