# Phase 1: Workflow Lifecycle Baseline - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 chỉ tập trung hoàn thiện lifecycle workspace/project/task ổn định và nhất quán giữa API/UI, bao gồm status model nền tảng cho vận hành team dev.
Không mở rộng sang capability mới ngoài WFLO-01 và WFLO-02.

</domain>

<decisions>
## Implementation Decisions

### Lifecycle scope & ownership

- Mô hình chuẩn: **workspace-level default + project override**.
- Khi tạo project mới, status schema được **clone từ workspace template tại thời điểm tạo** (không link động).
- V1 dùng **strict transition graph** để kiểm soát chất lượng vận hành ngay từ nền tảng.
- Quyền chỉnh sửa status schema: **workspace owner/admin + project manager**.

### Custom status model

- Preset mặc định v1: **To Do / In Progress / In Review / Done / Blocked**.
- Mỗi custom status bắt buộc map về category chuẩn (`todo`, `in_progress`, `in_review`, `done`, `blocked`) để tránh mâu thuẫn.
- Cho phép sửa/xóa status đang dùng **chỉ khi migrate task sang status khác trước**.
- Phạm vi cấu hình giữ theo mô hình: **workspace template + project override**.

### Archive semantics

- Archive dùng **soft-delete** (`isArchived`/`deletedAt`) và cho phép restore.
- Mặc định ẩn archived items; có toggle **Show archived**.
- Restore phải kiểm tra quan hệ cha; nếu cha archived thì chặn và hướng dẫn restore theo thứ tự.
- Quyền archive/restore theo role theo scope (workspace admin/project manager/owner).

### Cross-screen consistency UX

- V1 chọn **optimistic-first** cho cập nhật trạng thái ở UI.
- Cho phép optimistic cho toàn bộ transition, nhưng khi phát hiện conflict/stale data thì hiển thị cảnh báo + tải lại dữ liệu mới nhất + cho retry.
- Board/list auto refresh nhẹ khi app focus lại và có manual refresh control.

### Claude's Discretion

- Chi tiết kỹ thuật về schema migration, API endpoint shape, và invalidation strategy được phép quyết định trong phạm vi không trái các quyết định trên.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope & Phase Contracts

- `.planning/ROADMAP.md` — Định nghĩa boundary của Phase 1, goal, requirements và success criteria.
- `.planning/REQUIREMENTS.md` — Nguồn REQ-ID chính thức; Phase 1 gắn với `WFLO-01`, `WFLO-02`.
- `.planning/PROJECT.md` — Core value, constraints, và boundary v1 (không Keycloak/deploy/CI-CD).

### Existing Architecture & Patterns

- `.planning/codebase/ARCHITECTURE.md` — Luồng web↔api hiện có và các abstraction cần tái sử dụng.
- `.planning/codebase/STRUCTURE.md` — Vị trí code cần mở rộng trong `apps/web`, `apps/api`, `packages/shared`.
- `.planning/codebase/CONVENTIONS.md` — Naming/style/error-handling patterns cần giữ nhất quán.
- `.planning/codebase/STACK.md` — Runtime/framework constraints của brownfield stack.

### Research Guidance

- `.planning/research/SUMMARY.md` — Khuyến nghị sequencing và guardrails cho roadmap hiện tại.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `apps/api/src/modules/project/*` và `apps/api/src/modules/workspace/*`: domain services/controllers hiện có để mở rộng lifecycle logic.
- `apps/api/src/common/guards/*` + `apps/api/src/common/filters/*`: nền tảng auth/error handling để enforce role và phản hồi nhất quán.
- `apps/web/lib/services/*` + `apps/web/lib/api-client.ts`: service layer hiện có để chuẩn hóa gọi API và xử lý lỗi.
- `packages/shared/src/dtos/*`: contracts dùng chung để đồng bộ request/response giữa web/api.

### Established Patterns

- Backend theo module boundary (NestJS module/controller/service) — ưu tiên mở rộng trong domain modules, tránh logic rải rác.
- Frontend dùng App Router route groups + service abstraction — giữ luồng dữ liệu qua service layer.
- Prisma migrations đã có hướng soft-delete — phù hợp quyết định archive semantics của phase.

### Integration Points

- API entry: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`.
- Project/workspace/task domain points: `apps/api/src/modules/project/`, `apps/api/src/modules/workspace/`.
- UI workflow points: `apps/web/app/(private)/jira/` và hooks/services liên quan.
- Contract sync: `packages/shared/src/dtos/` + exports tại `packages/shared/src/index.ts`.

</code_context>

<specifics>
## Specific Ideas

- Ưu tiên một mô hình trạng thái đủ chặt ngay từ v1 (strict transition graph) để làm nền ổn định cho các phase AI sau.
- Trải nghiệm archived cần sạch: ẩn mặc định nhưng vẫn truy xuất/restore rõ ràng bằng toggle.
- Trải nghiệm thao tác trạng thái cần nhanh (optimistic-first) nhưng không bỏ qua xử lý conflict.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

_Phase: 01-workflow-lifecycle-baseline_
_Context gathered: 2026-03-19_
