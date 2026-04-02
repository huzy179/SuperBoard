# SuperBoard - Tinh nang nang cao nen hoc

Tai lieu nay tong hop cac tinh nang nang cao ban co the hoc va tu implement trong du an SuperBoard, theo huong practical de nang cap tu Jira-clone len production-grade platform.

## 1) Workspace va quyen truy cap nang cao

- Multi-role governance:
  - Them co che transfer owner workspace.
  - Cho phep policy role theo workspace (RBAC + custom role).
- Member lifecycle:
  - Invite by email co token het han.
  - Trang thai pending/accepted/revoked.
  - Audit log cho add/remove/change role.
  - Leave workspace flow cho user (co owner guard + cleanup default workspace).
- Scope guard architecture:
  - Tach helper verify scope theo module (workspace/project/task).
  - Viet test matrix cho owner/admin/member/viewer.

## 2) Project workflow engine

- Workflow template:
  - Tao bo status transition theo workspace.
  - Clone template sang project moi.
- Rule-based transition:
  - Guard transition theo role, assignee, due date.
  - Validate transition hop le truoc khi update task status.
- Event sourcing nhe:
  - Luu TaskEvent day du cho status, assignee, comment.
  - Dung event de tai tao timeline task.

## 3) Comment va collaboration real-time

- Real-time comments:
  - WebSocket/SSE de push comment moi.
  - Typing indicator va optimistic UI.
- Mention system:
  - Parse @username, notify nguoi duoc mention.
  - Deep-link den task/comment.
- Rich text va moderation:
  - Markdown parser + sanitize XSS.
  - Chinh sach edit/delete comments co soft-delete.

## 4) Performance va data strategy

- Query optimization:
  - Cursor pagination cho task list/comment list.
  - Co bo index theo truy van thuc te (workspaceId, deletedAt, createdAt).
- Caching strategy:
  - Redis cache cho dashboard metrics.
  - Cache invalidation theo event.
- API boundary:
  - DTO validation chat che, tranh over-fetching.
  - Chuan hoa response envelope + error code map.

## 5) Search va AI enhancement

- Semantic search:
  - Index task/comment vao vector store.
  - Combined keyword + semantic ranking.
- AI assistant:
  - Summary theo project/sprint.
  - Suggest next actions tu du lieu task qua han.
- Safety cho AI:
  - Prompt guardrails.
  - Logging + feedback loop de improve prompt quality.

## 6) Reliability, security, observability

- Security hardening:
  - Rate limit endpoint nhay cam.
  - Permission double-check o service layer.
  - Secret management va rotation.
- Reliability:
  - Outbox pattern cho notification/event.
  - Retry policy va idempotency key.
- Observability:
  - Structured logs theo requestId.
  - Metrics (p95, error rate, throughput).
  - Tracing cho flow tao task -> notify -> comment.

## 7) Testing maturity

- Unit tests theo helper/service:
  - Test negative paths (forbidden/not found/bad request).
- Integration tests:
  - Prisma transaction behavior.
  - Permission gates qua API endpoint.
- E2E tests:
  - Critical flows: create workspace, add member, create task, comment, archive.
  - Visual + UX regression voi Playwright.

## 8) Productization roadmap de hoc

- Giai doan 1 (co ban):
  - CRUD workspace/project/task + role guards + basic comments.
- Giai doan 2 (nang cao):
  - Workflow transitions, real-time comments, dashboard cache.
- Giai doan 3 (production):
  - Invite flow day du, observability stack, AI copilot co guardrails.

## Bai tap goi y theo thu tu

1. [DONE] Implement endpoint transfer owner workspace + test role matrix.
2. Them invite member voi token va expiration.
3. Bat real-time comment stream cho 1 task.
4. Them cursor pagination cho comments.
5. Viet E2E test cho full collaboration flow.

Feature tiep theo nen lam: Bai tap 2 (invite member voi token va expiration).
