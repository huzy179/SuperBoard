# DONE

> Những gì đã ship. Mỗi mục là một bước thật, không phải checkbox tutorial.

---

## Jira v1.48 — Infra Dev Cleanup + Dockerfile Web Fixes

- [x] Fix `Dockerfile.web`: thêm `ENV NODE_ENV=production PORT=3000`, fix WORKDIR, copy `.env.production` cho Next.js build
- [x] Tách `docker-compose.yml` thành minimal (postgres + redis) và `docker-compose.full.yml` (giữ đầy đủ)
- [x] Loại bỏ dead services khỏi compose minimal: keycloak, elasticsearch, minio, mailhog, ai-service (không có integration thật)
- [x] Update `package.json` scripts: `dev:infra` chạy compose minimal, `dev:infra:full` chạy compose full
- [x] Update Makefile comments mô tả rõ minimal vs full infra
- [x] `npx turbo typecheck` + `lint` pass ✅

## Jira v1.47 — Docker Deploy Readiness Fixes

- [x] Fix `Dockerfile.api`: `EXPOSE 3000` → `EXPOSE 4000` (khớp `PORT=4000` trong app)
- [x] Fix `Dockerfile.web`: thêm `ENV NODE_ENV=production` + `ENV PORT=3000`, sửa `EXPOSE 3001` → `EXPOSE 3000`
- [x] Fix `docker-compose.yml`: api port `3000:3000` → `4000:4000`, web port `3001:3001` → `3000:3000`
- [x] Fix `NEXT_PUBLIC_API_URL` trong compose: `http://api:3000` → `http://api:4000`
- [x] Loại bỏ `keycloak` khỏi `depends_on` của api service (app dùng JWT local, không cần Keycloak)
- [x] Xác nhận `npx turbo typecheck` + `npx turbo lint` pass ✅

## Jira v1.46 — Success Toast Notifications

- [x] Thêm `sonner` vào `@superboard/web` dependencies
- [x] Mount `<Toaster position="bottom-right">` trong `app/layout.tsx`
- [x] Toast cho project CRUD (`use-project-crud-form.ts`): tạo / cập nhật / lưu trữ ✅ / error
- [x] Toast cho task mutations (`use-task-mutations.ts`): tạo / cập nhật / cập nhật status / xoá / bulk ✅ / error
- [x] Toast cho subtask operations (`use-task-edit-panel.ts`): tạo / toggle / xoá ✅ / error
- [x] Toast cho comment operations (`use-task-comments.ts`): gửi / cập nhật / xoá ✅ / error
- [x] Xác nhận `npm run typecheck --workspace @superboard/web` pass ✅
- [x] Xác nhận `npx turbo lint --filter=@superboard/web` pass ✅

## Jira v1.45 — Typecheck Clean Pass

- [x] Fix pre-existing lỗi `FormEvent<HTMLFormElement>` trong `use-task-edit-panel`
  - Đổi `handleCreateSubtask` signature từ `(event: FormEvent<HTMLFormElement>)` → `()`
  - Đổi prop `TaskSubtaskManager.onCreateSubtask` type từ `(e: FormEvent) => void` → `() => void`
  - Cast `handleCreateSubtask as () => void` tại call site trong `TaskEditSlideOver`
  - Xoá `FormEvent` import không dùng trong `task-subtask-manager.tsx`
- [x] Xác nhận `npm run typecheck --workspace @superboard/web` pass ✅
- [x] Xác nhận `npx turbo lint --filter=@superboard/web` pass ✅

## Jira v1.44 — Wave 2c: Calendar + Header Actions Extraction

- [x] Tách calendar state/handlers khỏi `page.tsx` sang `use-project-calendar.ts`
  - `calendarMonth`, `setCalendarMonth`, `dueTasksByDate`, `tasksWithoutDueDate`, `calendarCells`, `calendarMonthLabel`, `prevMonth`, `nextMonth`
- [x] Tách realtime presence + copy-link khỏi `page.tsx` sang `use-project-header-actions.ts`
  - `viewerCount` (subscribeProjectPresence), `isCopyLinkSuccess`, `onCopyFilterLink`, `onOpenFilterInNewTab`
- [x] Dọn duplicate code trong `page.tsx`, giảm ~460 lines (từ 538 lines)
- [x] Lưu ý: typecheck có 1 lỗi pre-existing `FormEvent<HTMLFormElement>` trong `use-task-edit-panel` (không do refactor)

## Jira v1.43 — Worklog Sync + UX P0/P1 Scan Alignment

- [x] Đồng bộ trạng thái `doing.md` / `todo.md` theo tiến độ sprint hiện tại (E2E + smoke checklist đã hoàn tất)
- [x] Cập nhật checklist smoke test theo UI thực tế (empty state ở Project Detail)
- [x] Chốt kết quả rà nhanh UX P0/P1 theo code paths chính: empty/loading/error/responsive không có blocker nghiêm trọng

## Jira v1.42 — E2E Testing Foundation + Smoke Test Checklist

- [x] E2E flow exploration qua codebase: Login → Jira Home → Create Project → Create Task → Drag-drop → Comments/History
  - All flows implemented, no critical gaps
  - Known limitations documented: no toast on create, no real-time board sync, drag-drop not on mobile
- [x] Tạo `worklog/SMOKE_TEST_CHECKLIST.md` — comprehensive manual testing guide
  - 15 sections: login, home, projects, create task, drag-drop, comments, bulk ops, responsive, errors, security, logout
  - 150+ chi tiết test cases, ready for manual testing hoặc automation
  - Covers: empty states, loading states, error handling, mobile responsive (3 breakpoints)
- [x] Chạy `prettier --write .` format toàn project (all clean ✅)
- [x] Update `worklog/doing.md` để đánh dấu E2E exploration + checklist hoàn tất

## Jira v1.38 — Worklog Structure Alignment

- [x] Cập nhật lại `worklog/PROJECT_STRUCTURE.md` theo đúng cấu trúc repo hiện tại (web/api/ai-service/packages/docker/openspec/worklog)
- [x] Loại bỏ các mô tả cũ không còn đúng (ví dụ `apps/web` dạng tối giản, tài liệu `ambition/`)
- [x] Bổ sung lại quy tắc migration Prisma trong tài liệu cấu trúc để tránh schema drift

## Jira v1.39 — FE Maintainability Refactor (Wave 1)

- [x] Tách logic lọc/sắp xếp/chia nhóm project khỏi `use-jira-projects-page` sang `lib/helpers/jira-projects-page.ts`
- [x] Tách utility calendar + tạo URL filter hiện tại khỏi page detail sang `lib/helpers/project-detail-calendar.ts`
- [x] Giữ nguyên behavior UI, xác nhận pass `npm run typecheck --workspace @superboard/web`

## Jira v1.40 — FE Maintainability Refactor (Wave 2a)

- [x] Tách toàn bộ bulk action state/handlers + undo delete timer khỏi page sang hook `use-task-bulk-actions`
- [x] Giữ nguyên flow bulk update/delete và lock drag-drop trong project detail
- [x] Xác nhận pass `npm run typecheck --workspace @superboard/web`

## Jira v1.41 — FE Maintainability Refactor (Wave 2b)

- [x] Tách task detail/edit/subtask state + handlers khỏi `page.tsx` sang hook `use-task-edit-panel`
- [x] Giữ nguyên luồng UX của edit panel: focus trap, ESC close, reset form state, subtask create/toggle/delete
- [x] Xác nhận pass `npm run typecheck --workspace @superboard/web`

## Jira v1.37 — Frontend Structure Foundation Cleanup

- [x] Tách `project constants` dùng chung để tránh lặp localStorage keys và `ViewMode`
- [x] Tách `project-service` theo domain rõ hơn (`project-service`, `task-service`, `dashboard-service`)
- [x] Dời các component đặt sai chỗ về đúng layer (`notification-bell`, `task-comment-section`, `task-badges`)
- [x] Xoá dead component `app-frame.tsx`
- [x] Thêm barrel exports cho `components/jira`, `components/layout`, `components/notifications`, `components/ui`
- [x] Chạy `npx turbo lint` và `npx turbo typecheck` pass sau cleanup

## Jira v1.36 — Dashboard Chart Tooltip Polish

- [x] Thêm hover tooltip cho donut chart trạng thái (`count + percent`)
- [x] Thêm hover tooltip cho stacked chart độ ưu tiên (`count + percent`)
- [x] Thêm hover tooltip cho cột chart loại task (`count + percent`)
- [x] Sửa layout stacked priority bar để hiển thị thành phần ngang đúng kỳ vọng

## Jira v1.35 — Dashboard Visualization Refresh

- [x] Refactor `Tasks theo trạng thái` từ progress list sang donut chart có legend phần trăm
- [x] Refactor `Tasks theo độ ưu tiên` sang stacked composition bar để nhìn cơ cấu nhanh
- [x] Refactor `Tasks theo loại` sang biểu đồ cột dọc để so sánh tương quan tốt hơn

## Jira v1.34 — Dashboard Loading Skeleton

- [x] Thay loading toàn trang bằng skeleton theo cấu trúc dashboard (stats + chart blocks)
- [x] Cải thiện UX khi tải dữ liệu: không còn trạng thái trống/nhảy layout mạnh

## Jira v1.33 — Dashboard Runtime Fix + Chart Expansion

- [x] Sửa lỗi hook-order runtime ở Dashboard page (tránh lỗi render khi chuyển loading -> loaded)
- [x] Chuẩn hóa dữ liệu dashboard trong service để chịu được payload thiếu trường từ API
- [x] Thêm biểu đồ `Tasks theo độ ưu tiên` để tăng mật độ insight
- [x] Thêm khối `Tổng quan hoàn thành` hiển thị completion/overdue ratio

## Jira v1.32 — Jira Project Card UI Cleanup

- [x] Refactor lại bố cục project card để hierarchy rõ ràng hơn (header/progress/quick access/actions)
- [x] Đổi `Mở project` thành CTA chính full-width để tăng độ nhận diện thao tác quan trọng
- [x] Chuẩn hóa quick view links theo layout 3 cột để card ít vỡ khi responsive
- [x] Gom thao tác phụ về footer và chỉnh lại icon `Lưu trữ` đúng ngữ nghĩa

## Jira v1.31 — Reset Remembered Context (Jira Home)

- [x] Thêm utility trong hook để xóa ngữ cảnh đã lưu theo project (`last query` + `last view`)
- [x] Thêm utility xóa toàn bộ ngữ cảnh đã nhớ từ localStorage
- [x] Thêm action `Reset ngữ cảnh` ngay trên project card, chỉ bật khi project có context đã nhớ
- [x] Thêm nút `Reset ngữ cảnh (N)` trong thanh filter Jira Home để dọn trạng thái đã lưu hàng loạt

## Foundation

- [x] Monorepo Turborepo + TS strict config
- [x] Shared package: domain types, Zod schemas, WS events, ULID
- [x] Env validation (Zod) khi API startup
- [x] Docker dev stack: Postgres, Redis, MinIO, Keycloak, MailHog, Elasticsearch + health checks
- [x] Husky + lint-staged + Prettier
- [x] CI workflow: lint + typecheck + test
- [x] CD skeleton với paths filter per app
- [x] `/api/v1/health` trả trạng thái DB/Redis/queue
- [x] Pino structured logging + auto `correlationId`
- [x] `npm run db:reset` / `db:seed` / Makefile aliases
- [x] Đồng bộ `.env.example` giữa root/web/api/ai-service
- [x] Dọn Docker Compose, ổn định `dev:infra` → `dev` → `health:check`
- [x] `npm audit` → 0 vulnerabilities

## MVP1 — Login (E2E)

- [x] Prisma schema IAM: `Role`, `Permission`, `RolePermission`, `UserRole`, `WorkspaceMember`
- [x] Migration `auth_jira_mvp1`
- [x] `POST /auth/login` + `GET /auth/me` (JWT)
- [x] FE login flow: `/login` → token localStorage → route guard → `/jira`
- [x] Seed data: roles, permissions, users, workspace membership
- [x] Smoke test E2E pass: `owner@acme.local / Passw0rd!`

## Base Standardization v1

- [x] Response envelope thống nhất: `success`, `data/error`, `meta.timestamp`
- [x] `@Public()` + global auth guard
- [x] `@CurrentUser()` decorator
- [x] Global HTTP exception filter
- [x] Shared DTO theo domain (FE/BE)
- [x] FE parser cho envelope mới

## Jira v0.2 — Project + Task Board/List

- [x] `GET /projects/:id` detail + task list
- [x] `POST /projects/:id/tasks` tạo task từ project
- [x] `PATCH .../tasks/:id/status` đổi trạng thái
- [x] FE route `/jira/projects/[projectId]` — Board + List view
- [x] Kanban drag-drop đổi status
- [x] List view inline status change
- [x] Task Detail panel: xem/sửa/xóa

## Jira v0.3 — Soft Delete

- [x] `deletedAt` cho các bảng nghiệp vụ chính
- [x] Migration `add_global_soft_delete_columns`
- [x] DELETE → soft-delete (`update deletedAt`)
- [x] Filter BE không trả data đã soft-delete
- [x] Smoke test E2E: login → project → create task → delete → biến mất

## Jira v0.4 — Project CRUD

- [x] `PATCH /projects/:id` update (name/description/color/icon)
- [x] `DELETE /projects/:id` soft-delete (archive)
- [x] UI Jira Home: sửa + lưu trữ project

## Jira v0.5 — Task Fields

- [x] Shared DTO: `priority`, `dueDate`, `assigneeId`
- [x] BE xử lý + validate assignee theo workspace member
- [x] FE: form tạo task + detail panel hỗ trợ priority/dueDate/assignee

## Jira v0.6 — Consistency + Test Restructure

- [x] Chuẩn hóa soft-delete lifecycle BE: Workspace/Project/Task
- [x] Tái cấu trúc test theo service: `workspace/project/task.service.test.ts`
- [x] Xóa test cũ trùng, cập nhật script test
- [x] Ổn định pre-commit: lint scope + shared DTO exports
- [x] Tối ưu index Prisma theo query `deletedAt`

## Jira v0.7 — Comments + React Query

- [x] Implement task comments (CRUD)
- [x] Tích hợp React Query cho project + comment management
- [x] Fetch/mutation pattern chuẩn hóa

## Jira v0.8 — Labels, Types, Story Points, Schema Enhancements

- [x] TaskType enum (task/bug/story/epic), Label + TaskLabel join table
- [x] User.avatarColor, Project.key, Task.number/storyPoints
- [x] Seed data: 6 users, 4 projects, 29 tasks, 8 labels

## Jira v0.9 — Filter/Sort, Dashboard, Notifications, Settings

- [x] Client-side filter & sort (assignee/priority/type + sort by date/priority/SP)
- [x] Dashboard page: stat cards, status/project/assignee charts, activity feed
- [x] Notification module: bell icon, unread badge, mark read, triggers on assign/comment
- [x] Workspace Settings: member list, role management

## Jira v1.0 — Code Quality & UI Polish

- [x] Extract FE constants/components (task-badges, comment-section, notification-bell)
- [x] Shared helpers BE (requireWorkspace, findOrThrow, parseBooleanQuery)
- [x] Shared helpers FE (toDateInputValue, getInitials, percentOf)
- [x] React Query mutations cho project list
- [x] UI animations, visual polish across all pages

## Jira v1.1 — Board/List Bulk Actions + Safety UX

- [x] Refactor FE: tách components/hook cho Jira Home + Project Detail filter/create sections
- [x] Chuẩn hoá helper FE về `lib/helpers/*` (tránh trùng file/folder helper)
- [x] Nâng cấp filter task: search theo tiêu đề/mô tả/mã task + lọc trạng thái
- [x] Dashboard mở rộng: `tasksByType` từ API + hiển thị chart theo loại task
- [x] Bulk update status nhiều task (board + list)
- [x] Bulk delete nhiều task (soft-delete) + undo 5 giây
- [x] Banner undo với countdown + progress bar tuyến tính
- [x] Khoá drag-drop và inline status change khi pending bulk delete để tránh xung đột
- [x] Tooltip giải thích lý do control bị khoá
- [x] Bulk gán / bỏ gán người thực hiện cho nhiều task

## Jira v1.2 — Bulk API Maturity + URL/Realtime Improvements

- [x] Đồng bộ trạng thái UI vào URL query params (view/filter/sort/search) + sync Back/Forward
- [x] Chuyển bulk actions FE từ nhiều request/task sang 1 bulk API request
- [x] Bulk API mở rộng cập nhật nhiều trường trong một lần gọi
- [x] Optimistic cache update cho bulk operations (rollback khi lỗi)
- [x] Cross-tab realtime sync bằng BroadcastChannel cho project detail
- [x] Mở rộng cross-tab sync cho projects list và task comments
- [x] Debounce invalidate khi nhận burst events để giảm refetch dư thừa
- [x] Visibility-aware refetch: tab hidden thì defer, tab visible thì flush một lần

## Jira v1.3 — Bulk Field Expansion

- [x] Bulk cập nhật `priority` cho nhiều task
- [x] Bulk cập nhật `type` cho nhiều task
- [x] Bulk cập nhật/clear `dueDate` cho nhiều task
- [x] Mở rộng Task Bulk Action Bar với control cho priority/type/due date
- [x] API contract shared DTO cập nhật đồng bộ FE ↔ BE cho bulk fields mới

## Jira v1.4 — Task History via TaskEvent

- [x] Thêm endpoint `GET /projects/:projectId/tasks/:taskId/history`
- [x] Ghi `TaskEvent` cho các thao tác chính: create/update/status/assignee/bulk/delete/comment
- [x] FE thêm hook/service lấy task history theo task
- [x] Task detail panel hiển thị timeline lịch sử thao tác (ai làm gì, lúc nào)

## Jira v1.5 — API Contract Hardening

- [x] Chuẩn hoá DTO dùng chung cho Jira: `TaskStatusDTO`, `TaskEventTypeDTO`, `TaskEventActionDTO`
- [x] Siết type cho `TaskHistoryItemDTO` và `TaskHistoryPayloadDTO` (loại bỏ payload tự do)
- [x] Siết type cho `DashboardStatsDTO` (`tasksByStatus/priority/type`, `recentActivity.type`)
- [x] Đồng bộ mapping BE `project.service` và FE timeline theo contract typed mới

## Jira v1.6 — Archive Semantics Cleanup

- [x] Thống nhất archive semantics dùng `deletedAt` làm nguồn sự thật duy nhất
- [x] Loại bỏ cột `isArchived` khỏi schema Prisma (`Workspace`, `Project`, `Task`)
- [x] Tạo và apply migration `20260321142214_remove_is_archived_columns`
- [x] Cập nhật seed và shared types để bỏ phụ thuộc `isArchived`

## Jira v1.7 — Service Test Coverage for Task History

- [x] Cập nhật `project.service.test.ts` theo logic mới (`task.aggregate`, `taskEvent.create`)
- [x] Thêm test `getTaskHistoryForProject` để verify mapping payload + actor + type
- [x] Chạy test mục tiêu `test/services/project.service.test.ts` pass 100%

## Jira v1.8 — Calendar View (Project Tasks)

- [x] Thêm view mode `calendar` trong Jira project detail (song song board/list)
- [x] Lịch theo tháng có điều hướng tháng trước/sau, hiển thị task theo `dueDate`
- [x] Mỗi ngày hiển thị tối đa 3 task + chỉ báo số task còn lại
- [x] Click task trong lịch mở panel chi tiết task như các view khác
- [x] Bổ sung khu vực task chưa có hạn hoàn thành trong calendar view

## Jira v1.9 — Realtime Presence on Project Board

- [x] Mở rộng `ProjectGateway` phát event `project:presence` theo số client trong room
- [x] Quản lý join/switch/disconnect room để cập nhật presence chính xác
- [x] Thêm subscriber presence ở web socket client (`subscribeProjectPresence`)
- [x] Hiển thị badge realtime `👀 X đang xem` trên project detail header

## Jira v1.10 — Project Header Style + Breadcrumb

- [x] Thêm breadcrumb ở đầu trang project detail: `Dự án / <Tên project> / <View hiện tại>`
- [x] Tinh chỉnh header theo phong cách Kanban hiện đại (title lớn, metadata gọn, chip view rõ ràng)
- [x] Thêm avatar stack thành viên ở header để tăng ngữ cảnh team
- [x] Tinh chỉnh giao diện cột board (nhãn uppercase, count badge, action `...`) gần với ảnh mẫu

## Jira v1.11 — Full Project Detail UI Refresh (Kanban Style)

- [x] Làm mới đồng bộ giao diện project detail theo cùng một phong cách (header/filter/bulk/board/list/calendar)
- [x] Restyle `TaskFilterBar` và `TaskBulkActionBar` thành toolbar dạng card, spacing/typography nhất quán
- [x] Restyle `TaskCreateForm` để đồng bộ với style card trắng + input nền trung tính
- [x] Nâng cấp board task card interaction (hover, hierarchy, mật độ thông tin) và list table visual hierarchy
- [x] Cập nhật calendar + task detail slide-over border/background để đồng bộ ngôn ngữ thiết kế

## Jira v1.12 — Settings Member Management Enhancements

- [x] Thêm tìm kiếm thành viên theo tên/email ở trang settings
- [x] Thêm lọc vai trò (all/owner/admin/member) cho bảng thành viên
- [x] Thêm sắp xếp ngày tham gia (mới trước/cũ trước)
- [x] Thêm trạng thái rỗng và nút đặt lại bộ lọc cho trải nghiệm quản trị tốt hơn

## Jira v1.13 — Notification Center Usability

- [x] Thêm tab lọc thông báo `Tất cả / Chưa đọc` trong dropdown chuông
- [x] Thêm tìm kiếm nhanh theo nội dung thông báo
- [x] Thêm thống kê số thông báo đang hiển thị sau khi lọc/tìm kiếm
- [x] Giữ nguyên API hiện tại, cải thiện UX hoàn toàn ở frontend

## Jira v1.14 — Dashboard Activity Feed Filters

- [x] Thêm lọc hoạt động theo loại sự kiện trong Dashboard
- [x] Thêm tìm kiếm theo `taskTitle` / `actorName` ở activity feed
- [x] Thêm đếm kết quả sau lọc và empty state khi không khớp
- [x] Thêm nút đặt lại bộ lọc activity để thao tác nhanh

## Jira v1.15 — Dashboard Priority Focus (Projects Needing Attention)

- [x] Thêm block `Dự án cần chú ý` để ưu tiên project có tỷ lệ hoàn thành thấp
- [x] Xếp hạng theo completion rate tăng dần, tie-break theo số task còn lại
- [x] Hiển thị tiến độ %, số task còn lại và link nhanh vào project tương ứng

## Jira v1.16 — Dashboard Quick Actions from Priority Focus

- [x] Thêm quick action `Xem task chưa xong` (view list + filter `todo,in_progress`) từ block dự án cần chú ý
- [x] Thêm quick action `Mở board` để điều hướng thẳng vào board của project cần xử lý

## Jira v1.17 — Project Detail Shareable Filter Link

- [x] Thêm nút `Sao chép link` ở header project detail
- [x] Sao chép URL hiện tại kèm query filter/view/sort để chia sẻ đúng ngữ cảnh
- [x] Thêm trạng thái phản hồi nhanh `Đã sao chép` sau khi copy thành công

## Jira v1.18 — Project Detail Open in New Tab

- [x] Thêm nút `Mở tab mới` cạnh `Sao chép link` trong header project detail
- [x] Mở đúng URL hiện tại kèm toàn bộ query filter/view/sort để giữ ngữ cảnh

## Jira v1.19 — Dashboard API Mock Fallback

- [x] Thêm mock data typed cho `DashboardStatsDTO` ở FE
- [x] Bổ sung fallback trong `getDashboardStats()` khi endpoint BE chưa sẵn sàng (404/501/502/503 hoặc lỗi mạng)
- [x] Cho phép tắt fallback bằng biến `NEXT_PUBLIC_ENABLE_API_MOCK_FALLBACK=false`

## Jira v1.20 — Robust Board Ordering (Fractional + Rebalance)

- [x] Nâng cấp `buildFractionalTaskPosition` để phát hiện khoảng cách position quá nhỏ
- [x] Thêm luồng `rebalance` tự động sắp xếp lại toàn cột khi drag-drop cùng cột có nguy cơ trùng/thấp độ chính xác
- [x] Giữ drag-drop mượt cho cả đổi cột và reorder trong cùng cột, đồng thời tránh drift position sau nhiều lần kéo

## Jira v1.21 — Realtime Multi-user Task Drag Sync

- [x] Mở rộng websocket gateway với event granular `project:task-patched`
- [x] Emit event task patch ngay sau `PATCH /tasks/:taskId/status` để đồng bộ drag-drop theo task-level
- [x] FE subscribe `project:task-patched` và patch React Query cache trực tiếp (không chờ refetch)
- [x] Giữ cơ chế `project:updated` hiện có làm fallback invalidate để đảm bảo tính nhất quán

## Jira v1.22 — Favorite Projects on Jira Home

- [x] Thêm tính năng ghim/bỏ ghim dự án ngay trên project card
- [x] Ưu tiên hiển thị dự án ghim lên đầu danh sách
- [x] Lưu trạng thái ghim ở localStorage để giữ preference theo trình duyệt

## Jira v1.23 — Favorites-only Filter on Jira Home

- [x] Thêm toggle `Dự án ghim` ở Jira Home để lọc nhanh chỉ project đã ghim
- [x] Hiển thị badge số lượng project đã ghim ngay trên nút toggle
- [x] Empty state chuyên biệt khi đang bật chế độ chỉ xem project ghim

## Jira v1.24 — Jira Home Group by Recency

- [x] Nhóm danh sách project theo `Cập nhật hôm nay` và `Cũ hơn`
- [x] Hiển thị số lượng dự án cho từng nhóm để quét nhanh
- [x] Điều chỉnh grid để tránh lặp card `Dự án mới` khi render nhiều nhóm

## Jira v1.25 — Subtasks MVP (Nested 1 Level)

- [x] Prisma schema + migration thêm quan hệ `Task.parentTaskId` self-reference 1 cấp
- [x] Mở rộng shared DTO (`parentTaskId`, `subtaskProgress`) đồng bộ FE ↔ BE
- [x] API tạo/cập nhật task hỗ trợ `parentTaskId` + validate không cho nested > 1 cấp
- [x] Project detail chỉ render root tasks ở board/list/calendar để tránh lẫn subtask
- [x] Task detail panel thêm khu vực Subtasks: quick add, toggle done, xoá, mở chi tiết subtask
- [x] Parent task hiển thị progress subtasks `done/total (%)`

## Jira v1.26 — Jira Home Sorting Controls

- [x] Thêm sort key cho Jira Home: `updated_desc`, `updated_asc`, `name_asc`, `name_desc`
- [x] Bảo toàn ưu tiên project ghim, sau đó áp dụng sort theo lựa chọn người dùng
- [x] Thêm dropdown `Sắp xếp dự án` trên Jira Home để đổi thứ tự hiển thị tức thì

## Jira v1.27 — Jira Home Project Card Quick Actions

- [x] Thêm quick action `Board` trên card dự án để mở thẳng Kanban view
- [x] Thêm quick action `Danh sách` trên card dự án để mở thẳng List view
- [x] Tối ưu thao tác vào project thường dùng mà không thay đổi hành vi cũ của card

## Jira v1.28 — Jira Home Calendar Quick Action

- [x] Thêm quick action `Lịch` trên card dự án để mở thẳng Calendar view
- [x] Đồng bộ nhóm quick actions để chuyển view nhanh từ Jira Home (Board/List/Calendar)

## Jira v1.29 — Remember Last View per Project

- [x] Lưu view gần nhất theo từng project ở localStorage khi user thao tác ở project detail
- [x] Nút `Mở project` trên Jira Home tự điều hướng vào view gần nhất đã dùng
- [x] Giữ URL gọn cho view mặc định `board`, chỉ thêm query khi cần (`list`/`calendar`)

## Jira v1.30 — Remember Last Context + Jira Home UI Repair

- [x] Mở rộng lưu ngữ cảnh theo project từ chỉ `view` sang toàn bộ query params (view/filter/sort/search)
- [x] Nút `Mở project` trên Jira Home khôi phục đúng URL ngữ cảnh cuối cùng nếu có
- [x] Sửa vỡ layout card actions bằng cấu trúc 2 hàng có `flex-wrap` (truy cập nhanh tách riêng thao tác quản trị)
- [x] Làm gọn giao diện actions để tránh rối khi số nút tăng
