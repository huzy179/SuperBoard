# Kế Hoạch Cải Thiện Frontend

## Current Findings

- `apps/web/src` trước refactor có nhiều direct `fetch(` nằm trong component/hook feature, chủ yếu ở executive, AI planner, automation, knowledge, QA, reports và search.
- Một số feature tự build URL bằng `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'`, làm trùng logic base URL và khó đổi môi trường.
- React Query key đang dùng string array rải rác theo từng feature, chưa có registry chung.
- Notification/error handling còn lẫn giữa API client, component và mutation hook.
- Các cụm lặp rõ nhất nằm ở hidden-tab invalidation của project queries, automation rule flows, bulk action menu và chart shell/style của reports.

## API Refactor Plan

- Chỉ cho phép HTTP transport nằm trong `apps/web/src/lib/api-client.ts`.
- `apiRequest` hỗ trợ `params`, `signal`, `cache` và `responseType: 'json' | 'blob' | 'text' | 'void'`.
- JSON response mặc định unwrap `ApiResponse<T>`. Raw JSON vẫn được trả về để giữ backward compatibility với endpoint chưa chuẩn hóa.
- `void` dùng cho `204` hoặc success response không cần `data`.
- `getApiBaseUrl` là nguồn duy nhất cho API/socket/media base URL.
- API client không hiển thị toast trực tiếp. UI error/success đi qua `notify`, `useAppQuery`, `useAppMutation` hoặc component state.
- `API_ENDPOINTS` là registry cho executive, AI, automation, knowledge, connect, QA, talent, search và report export endpoints.
- Feature code gọi HTTP qua `features/**/api/*-service.ts`; component/hook không gọi `fetch` trực tiếp.

## Duplication Cleanup Plan

- Query keys tập trung ở `apps/web/src/lib/query-keys.ts`.
- Query có notification chuẩn dùng `useAppQuery`; mutation ghi dữ liệu server dùng `useAppMutation`.
- Hidden-tab deferred invalidation được tách thành `useDeferredQueryInvalidation`.
- Automation rule create/generate/list/toggle/delete dùng `automation-service` và `use-automation-rules`.
- Bulk action menu được tách thành shared `TaskBulkActionMenu`.
- Reports chart shell/theme được tách thành `ReportChartShell` và constants dùng chung cho axis/grid/tooltip/legend.

## Migration Checklist

- [x] Nâng cấp `api-client` backward-compatible.
- [x] Export `getApiBaseUrl`.
- [x] Bỏ toast khỏi API client.
- [x] Bổ sung endpoint registry còn thiếu.
- [x] Thêm `queryKeys`, `useAppQuery`, `useDeferredQueryInvalidation`.
- [x] Migrate direct `fetch(` trong `apps/web/src`.
- [x] Dùng service hiện có để AI planner tạo từng task được chọn.
- [x] Reports export dùng `responseType: 'blob'`.
- [ ] Migrate dần toàn bộ query/mutation còn lại sang `queryKeys`, `useAppQuery`, `useAppMutation`.
- [ ] Thêm lint rule custom cấm `fetch(` ngoài `api-client.ts` ở phase sau.

Acceptance check hiện tại:

```bash
rg "fetch\\(" apps/web/src
```

Kết quả mong muốn: chỉ còn `apps/web/src/lib/api-client.ts`.

## Test Checklist

- [x] `npm --workspace @superboard/web run lint`
- [x] `npm --workspace @superboard/web run typecheck`
- [x] `npm --workspace @superboard/web run test`
- [x] Unit test `api-client`: unwrap JSON success.
- [x] Unit test `api-client`: map error thành `ApiClientError`.
- [x] Unit test `api-client`: append `params`.
- [x] Unit test `api-client`: không set `Content-Type` khi body là `FormData`.
- [x] Unit test `api-client`: xử lý `void`, `blob`, `text`.

Manual smoke cần chạy trước release:

- Login/session.
- Dashboard load.
- Project board/list/calendar load.
- Create/update/archive/restore task.
- AI planner generate và execute nhiều task được chọn.
- Automation list/toggle/delete.
- Reports export CSV/JSON.

## Follow-Up Items

- Responsive: rà lại các panel dense như reports, automation và AI modals ở mobile width.
- Accessibility: thêm label/aria cho icon-only controls, menu trigger và modal close buttons.
- Visual polish: giảm các `rounded-[3rem+]` ở UI vận hành, đồng bộ spacing token và kiểm tra text overflow.
- Performance: lazy-load các visual heavy components như knowledge graph, vector atlas và digital twin khi không nằm trong viewport.
- Enforcement: thêm ESLint custom rule hoặc `lint:api-boundary` script để fail khi `fetch(` xuất hiện ngoài `src/lib/api-client.ts`.
