# Phase 1: Workflow Lifecycle Baseline - Research

**Researched:** 2026-03-20
**Domain:** Workflow lifecycle (workspace/project/task), status schema governance, soft-delete archive semantics, optimistic UI consistency
**Confidence:** MEDIUM

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                            | Research Support                                                                                                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WFLO-01 | User có thể quản lý lifecycle đầy đủ cho workspace/project/task qua API và UI nhất quán (create/read/update/archive).  | Architecture patterns 1-4, Soft-delete + restore invariants, module split (workspace/project/task), optimistic UI rollback, role guard strategy.                |
| WFLO-02 | User có thể cấu hình và sử dụng custom statuses theo project/workspace mà không phá vỡ tính nhất quán trạng thái task. | Status schema model (workspace template + project override), strict transition graph, status-category mapping, migration rules for rename/delete in-use status. |

</phase_requirements>

## Summary

Hiện codebase đã có baseline tốt cho project/task CRUD trong `ProjectModule` (Nest controller/service + Prisma + shared DTO + Next.js service layer), nhưng chưa đạt Phase 1 contract. Cụ thể: chưa có workspace lifecycle module, task lifecycle đang gắn vào project module, status model còn hard-code enum (`todo/in_progress/in_review/done/cancelled`) và chưa hỗ trợ custom status theo workspace/project.

Các quyết định trong CONTEXT yêu cầu một mô hình rõ ràng hơn: workspace template status, project override clone-at-create, strict transition graph, archive/restore có thứ tự quan hệ cha-con, optimistic-first UI có rollback khi conflict. Đây là thay đổi kiến trúc ở domain layer + schema level, không chỉ thêm endpoint.

Khuyến nghị planning: ưu tiên thiết kế data model/status policy trước (Prisma schema + transition rules + authorization scope), sau đó mới wiring API/UI. Nếu không làm theo thứ tự này, nguy cơ rework cao ở migration, DTO contract và cross-screen consistency.

**Primary recommendation:** Chuẩn hóa status schema thành thực thể cấu hình (không hard-code enum luồng business), enforce transition + archive invariants tại service layer, rồi triển khai optimistic UI + conflict recovery nhất quán trên board/list.

## Standard Stack

### Core

| Library            | Version                                  | Purpose                                               | Why Standard                                                                              |
| ------------------ | ---------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| @nestjs/common     | 11.1.17 (published/modified: 2026-03-16) | API module/controller/guard lifecycle                 | Đang là backbone backend hiện tại, phù hợp module boundary theo domain                    |
| @prisma/client     | 7.5.0 (published/modified: 2026-03-19)   | Data access, migrations, transactional invariants     | Toàn bộ persistence hiện tại đã dùng Prisma; phase này cần migration + transaction strict |
| @superboard/shared | 0.1.0 (workspace package)                | DTO/contracts đồng bộ API↔UI                          | Tránh drift giữa backend response và frontend consumption                                 |
| zod                | 4.3.6 (published/modified: 2026-01-25)   | Runtime validation for complex status config payloads | Đã có trong cả API/Web dependencies, phù hợp validate status graph payload                |

### Supporting

| Library               | Version                                 | Purpose                                      | When to Use                                                                          |
| --------------------- | --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| @tanstack/react-query | 5.91.2 (published/modified: 2026-03-19) | Optimistic mutations, rollback, revalidation | Dùng cho WFLO-01/02 thao tác status/archive cần optimistic-first + conflict recovery |
| pino                  | 10.3.1                                  | Structured logs + correlation visibility     | Log transition/archive conflicts, permission denials, retry path                     |

### Alternatives Considered

| Instead of                               | Could Use                                   | Tradeoff                                                                                           |
| ---------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| React Query optimistic mutation          | Hand-rolled useState + reloadSeed           | Dễ bắt đầu nhưng khó scale khi nhiều mutation đồng thời, rollback dễ lỗi cạnh                      |
| Prisma service-level soft-delete filters | Prisma query extensions/middleware approach | Extension mạnh nhưng có hạn chế nested operations; phase này ưu tiên explicit domain rules rõ ràng |
| Strict transition graph                  | Free-form status update                     | Nhanh ban đầu nhưng phá nhất quán workflow và khó audit policy sau này                             |

**Installation:**

```bash
npm --workspace @superboard/api install @nestjs/common@^11.1.17 @prisma/client@^7.5.0 prisma@^7.5.0 zod@^4.3.6
npm --workspace @superboard/web install @tanstack/react-query@^5.91.2 zod@^4.3.6
```

**Version verification:**

```bash
npm view @nestjs/common version && npm view @nestjs/common time.modified
npm view @prisma/client version && npm view @prisma/client time.modified
npm view zod version && npm view zod time.modified
npm view @tanstack/react-query version && npm view @tanstack/react-query time.modified
```

## Architecture Patterns

### Recommended Project Structure

```text
apps/api/src/modules/
├── workspace/                # workspace lifecycle + workspace-level status template
├── project/                  # project CRUD + project-level status override
├── task/                     # task lifecycle + transition/archival operations
└── workflow/                 # shared transition policy + status mapping domain service

packages/shared/src/
├── dtos/workflow-status.dto.ts
└── types/workflow-status.types.ts

apps/web/
├── lib/services/workflow-service.ts
├── hooks/use-workflow-statuses.ts
└── app/(private)/jira/...    # board/list screens + show archived + manual refresh
```

### Pattern 1: Workspace Template + Project Snapshot Override

**What:** Workspace giữ template status; khi tạo project thì clone snapshot vào project-level config.
**When to use:** Khi cần ổn định lịch sử project dù workspace template thay đổi sau này.
**Example:**

```typescript
// Source: project decision in 01-CONTEXT.md + Prisma transaction docs
await prisma.$transaction(async (tx) => {
  const project = await tx.project.create({ data: { name, workspaceId } });
  const workspaceStatuses = await tx.workflowStatus.findMany({
    where: { workspaceId, projectId: null, deletedAt: null },
    orderBy: { orderIndex: 'asc' },
  });

  await tx.workflowStatus.createMany({
    data: workspaceStatuses.map((status) => ({
      workspaceId,
      projectId: project.id,
      key: status.key,
      label: status.label,
      category: status.category,
      orderIndex: status.orderIndex,
      transitionRules: status.transitionRules,
    })),
  });
});
```

### Pattern 2: Strict Transition Graph as Domain Policy

**What:** Chỉ cho phép transition nếu cặp from→to tồn tại trong rule set.
**When to use:** Mọi cập nhật task status (API và UI đều đi qua cùng policy).
**Example:**

```typescript
// Source: context decision + Prisma optimistic concurrency guidance
function assertTransitionAllowed(
  fromStatus: string,
  toStatus: string,
  allowed: Record<string, string[]>,
) {
  if (fromStatus === toStatus) return;
  const next = allowed[fromStatus] ?? [];
  if (!next.includes(toStatus)) {
    throw new BadRequestException(`Invalid transition: ${fromStatus} -> ${toStatus}`);
  }
}
```

### Pattern 3: Soft-Delete + Restore with Parent Invariant

**What:** `isArchived`/`deletedAt` cho cả project/task/workspace, restore theo thứ tự cha trước con.
**When to use:** Archive/restore endpoint và query filters mặc định.
**Example:**

```typescript
// Source: existing schema + phase context
if (task.project.isArchived || task.project.deletedAt) {
  throw new BadRequestException(
    'Cannot restore task while project is archived. Restore project first.',
  );
}

await prisma.task.update({
  where: { id: taskId },
  data: { isArchived: false, deletedAt: null },
});
```

### Pattern 4: Optimistic-first UI + Rollback + Revalidate

**What:** Update local state ngay, rollback khi lỗi, sau đó re-fetch authoritative server state.
**When to use:** Board drag-drop, list status dropdown, archive/restore toggle.
**Example:**

```typescript
// Source: existing project detail page optimistic flow + TanStack optimistic updates guide
const previous = queryClient.getQueryData(['project', projectId]);
queryClient.setQueryData(['project', projectId], optimisticApply(previous, update));

try {
  await api.updateTaskStatus(projectId, taskId, { status });
} catch (error) {
  queryClient.setQueryData(['project', projectId], previous);
  throw error;
} finally {
  await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
}
```

### Anti-Patterns to Avoid

- **Status enum as business workflow source-of-truth:** enum hữu ích cho category nền nhưng không đủ cho custom status lifecycle WFLO-02.
- **Bypass domain policy in controller:** validate transition/archive chỉ ở controller sẽ dễ drift khi có nhiều endpoint.
- **Inconsistent soft-delete predicates:** quên `isArchived/deletedAt` ở 1 query sẽ rò dữ liệu archived ra UI.
- **No concurrency token on status mutation:** optimistic UI không có conflict detection sẽ gây ghi đè im lặng.

## Don't Hand-Roll

| Problem                         | Don't Build                                      | Use Instead                                          | Why                                                               |
| ------------------------------- | ------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------- |
| API auth/authorization baseline | Custom middleware chain for every route          | Nest guard + metadata (`APP_GUARD`, role decorators) | Nest guards đã đúng execution stage và dễ enforce nhất quán       |
| Transaction orchestration       | Manual SQL transaction handling in service logic | Prisma `$transaction` + nested writes                | Giảm lỗi atomicity/rollback và phù hợp stack hiện tại             |
| Optimistic cache bookkeeping    | Tự quản lý cache map/rollback queue phức tạp     | TanStack Query mutation lifecycle                    | Có onMutate/onError/onSettled patterns chuẩn cho optimistic-first |
| DTO sync between apps           | Duplicate DTO types in web/api riêng lẻ          | `@superboard/shared` contracts                       | Tránh contract drift và giảm bug tích hợp                         |

**Key insight:** Với phase này, rủi ro nằm ở consistency giữa nhiều màn hình + nhiều endpoint + nhiều quan hệ domain; hand-rolled custom mechanisms thường phá vỡ invariants nhanh hơn lợi ích ban đầu.

## Common Pitfalls

### Pitfall 1: Status Taxonomy Drift (Blocked vs Cancelled)

**What goes wrong:** Decision yêu cầu `blocked`, nhưng code hiện tại dùng `cancelled` trong `TaskStatus` enum và DTO.
**Why it happens:** Workflow semantics đang hard-code sớm ở schema.
**How to avoid:** Tách `status category` chuẩn khỏi `display/custom status`; thêm migration map rõ `cancelled` legacy.
**Warning signs:** UI label và API payload lệch nhau giữa board/list/create form.

### Pitfall 2: Archive Filter Inconsistency

**What goes wrong:** Một số query lọc `deletedAt: null` nhưng quên `isArchived: false` (đặc biệt task include trong project detail).
**Why it happens:** Soft-delete rule không đóng gói thành helper/domain invariant.
**How to avoid:** Chuẩn hóa query helpers (`activeProjectWhere`, `activeTaskWhere`) và áp dụng toàn service layer.
**Warning signs:** Task/project archived vẫn xuất hiện khi refresh hoặc sau mutation.

### Pitfall 3: Missing Role Scope Enforcement

**What goes wrong:** Hiện chỉ có bearer auth guard global, chưa enforce workspace admin/project manager cho schema edits.
**Why it happens:** AuthN đã có nhưng authZ theo domain scope chưa gắn endpoint-level policy.
**How to avoid:** Role-based decorator + guard đọc scope theo workspace/project relation.
**Warning signs:** Member thường có thể archive/restore hoặc sửa status schema.

### Pitfall 4: Optimistic Update Without Conflict Strategy

**What goes wrong:** Người dùng A/B cập nhật cùng task, UI một phía ghi đè trạng thái cũ mà không phát hiện stale write.
**Why it happens:** Thiếu version/timestamp check ở mutation where clause.
**How to avoid:** Dùng OCC token (`updatedAt` hoặc `version`) và trả lỗi conflict để UI rollback + retry.
**Warning signs:** “Saved” nhưng sau refresh task trở về trạng thái khác.

## Code Examples

Verified patterns from official sources and existing codebase:

### NestJS Global Guard Registration

```typescript
// Source: https://docs.nestjs.com/guards
providers: [
  {
    provide: APP_GUARD,
    useClass: BearerAuthGuard,
  },
];
```

### Prisma Transaction for Atomic Lifecycle Operations

```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
await prisma.$transaction(async (tx) => {
  await tx.project.update({
    where: { id: projectId },
    data: { isArchived: true, deletedAt: new Date() },
  });
  await tx.task.updateMany({
    where: { projectId, deletedAt: null },
    data: { isArchived: true, deletedAt: new Date() },
  });
});
```

### Existing Optimistic Pattern in Current UI

```typescript
// Source: apps/web/app/(private)/jira/projects/[projectId]/page.tsx
const previous = project;
setProject({ ...previous, tasks: nextTasks });

try {
  await updateProjectTaskStatus(project.id, taskId, { status });
} catch (error) {
  setProject(previous); // rollback
}
```

## State of the Art

| Old Approach                  | Current Approach                                        | When Changed                                         | Impact                                                             |
| ----------------------------- | ------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| Hard-coded finite enum status | Configurable status schema + canonical category mapping | Became standard as teams need workflow customization | Cho phép tùy biến theo team mà vẫn giữ analytics/reporting ổn định |
| Naive read-then-write updates | OCC token + optimistic UI rollback                      | Widely adopted in collaborative apps                 | Giảm silent overwrite khi concurrent edits                         |
| Delete = hard remove          | Soft-delete + restore policy                            | Mature SaaS workflow pattern                         | Bảo toàn auditability và recovery operations                       |

**Deprecated/outdated:**

- Single global status enum as full workflow model: không đáp ứng WFLO-02 và gây migration pain khi mở rộng.
- UI reload-only consistency: phản hồi chậm, dễ gây duplicate actions và trạng thái “nhấp nháy” ở board/list.

## Open Questions

1. **Legacy handling cho `cancelled` hiện tại sẽ map sang category nào?**
   - What we know: preset phase yêu cầu `blocked`, code hiện có `cancelled`.
   - What's unclear: giữ cả hai như category khác nhau hay migrate `cancelled` -> `blocked` cho v1.
   - Recommendation: chốt migration strategy sớm trong Wave 0; nếu chưa chắc, support legacy read + normalized write.

2. **Workspace lifecycle CRUD cụ thể gồm endpoint nào trong v1?**
   - What we know: WFLO-01 yêu cầu workspace lifecycle full qua API/UI.
   - What's unclear: mức sâu của workspace settings/edit/archive màn hình v1.
   - Recommendation: planner tách rõ “minimum workspace CRUD contract” trước khi chia plan files.

3. **Conflict response contract cho optimistic retry dùng status code nào?**
   - What we know: cần cảnh báo stale data + retry.
   - What's unclear: dùng `409 Conflict` hay `412 Precondition Failed` và payload shape.
   - Recommendation: chọn 1 chuẩn duy nhất cho toàn bộ task status/archive mutations.

## Validation Architecture

### Test Framework

| Property           | Value                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| Framework          | None detected in repo (recommend Vitest 3.x for TS services/controllers)       |
| Config file        | none — see Wave 0                                                              |
| Quick run command  | `npm --workspace @superboard/api run test` (currently missing script)          |
| Full suite command | `npm test` (delegates to workspace scripts; currently no phase-relevant tests) |

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                 | Test Type           | Automated Command                                                | File Exists? |
| ------- | ------------------------------------------------------------------------ | ------------------- | ---------------------------------------------------------------- | ------------ |
| WFLO-01 | CRUD + archive/restore consistency for workspace/project/task via API/UI | integration + smoke | `npm --workspace @superboard/api run test -- workflow-lifecycle` | ❌ Wave 0    |
| WFLO-02 | Custom status schema + strict transition + migration safety              | unit + integration  | `npm --workspace @superboard/api run test -- workflow-status`    | ❌ Wave 0    |

### Sampling Rate

- **Per task commit:** `npm --workspace @superboard/api run test -- workflow-*`
- **Per wave merge:** `npm test`
- **Phase gate:** Full phase workflow tests green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/api/test/workflow-lifecycle.integration.test.ts` — covers WFLO-01
- [ ] `apps/api/test/workflow-status-policy.unit.test.ts` — covers WFLO-02
- [ ] `apps/web/__tests__/jira-status-flow.test.tsx` — optimistic rollback + stale warning UX
- [ ] `apps/api/vitest.config.ts` — test runner config
- [ ] Framework install: `npm --workspace @superboard/api install -D vitest @vitest/coverage-v8 tsx` and add `test` script

## Sources

### Primary (HIGH confidence)

- Repository codebase: `apps/api/src/modules/project/*`, `apps/api/prisma/schema.prisma`, `apps/web/app/(private)/jira/projects/[projectId]/page.tsx`, `.planning/*` phase artifacts.
- npm registry verification:
  - `npm view @nestjs/common version && npm view @nestjs/common time.modified`
  - `npm view @prisma/client version && npm view @prisma/client time.modified`
  - `npm view zod version && npm view zod time.modified`
  - `npm view @tanstack/react-query version && npm view @tanstack/react-query time.modified`

### Secondary (MEDIUM confidence)

- NestJS official docs:
  - https://docs.nestjs.com/guards
  - https://docs.nestjs.com/controllers
  - https://docs.nestjs.com/modules
- Prisma official docs:
  - https://www.prisma.io/docs/orm/prisma-client/queries/transactions
  - https://www.prisma.io/docs/orm/prisma-client/queries/crud
  - https://www.prisma.io/docs/orm/prisma-client/client-extensions

### Tertiary (LOW confidence)

- TanStack Query optimistic updates page fetch returned limited content snapshot in this run:
  - https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
  - Marked LOW only for details not directly visible in fetched content; concept validated by current ecosystem usage.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - verified by repository dependency graph + npm registry current versions.
- Architecture: MEDIUM - strongly grounded in codebase and locked decisions; still dependent on unresolved legacy migration choices.
- Pitfalls: MEDIUM - directly observed from current code patterns and requirement mismatch.

**Research date:** 2026-03-20
**Valid until:** 2026-04-19 (30 days)
