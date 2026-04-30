# Frontend Development Guide & Status

This document tracks the current state of the frontend, audit findings, and the ongoing improvement plan.

## 1. UI Audit Findings (2026-04-30)

Target areas: `apps/web/src`, `packages/ui/src`

### Style Violations & Hits

- **Terminal/dark text**: 38 hits (Review needed for contrast)
- **White borders**: 4 hits
- **Attention animations**: 6 hits
- **Aggressive uppercase UI**: 2 hits

### Priority Refactor Files

- `apps/web/src/app/globals.css`
- `apps/web/src/app/(private)/chat/layout.tsx`
- `apps/web/src/features/system/user/components/AvatarUpload.tsx`

---

## 2. Kế Hoạch Cải Thiện Frontend (Improvement Plan)

### Current State

- `apps/web/src` có nhiều direct `fetch(` nằm trong component/hook.
- React Query key chưa tập trung.
- Notification/error handling còn phân tán.

### API Refactor Plan

- **Unified Client**: Chỉ cho phép HTTP transport trong `apps/web/src/lib/api-client.ts`.
- **Registry**: `API_ENDPOINTS` là nguồn duy nhất cho các đường dẫn API.
- **Service Layer**: Feature code gọi HTTP qua `features/**/api/*-service.ts`.

### Duplication Cleanup

- **Query Keys**: Tập trung ở `apps/web/src/lib/query-keys.ts`.
- **Standard Hooks**: Sử dụng `useAppQuery` và `useAppMutation` để xử lý chuẩn hóa.
- **Shared Components**: Tách các cụm lặp như `TaskBulkActionMenu`, `ReportChartShell`.

---

## 3. Migration Checklist

- [x] Nâng cấp `api-client` backward-compatible.
- [x] Bỏ toast khỏi API client (dùng notify service).
- [x] Migrate direct `fetch(` trong `apps/web/src`.
- [ ] Migrate dần toàn bộ query/mutation còn lại sang `queryKeys`.
- [ ] Thực hiện Visual Polish: giảm các `rounded-[3rem+]`, đồng bộ spacing token.

---

## 4. Enforcement

Chạy lệnh sau để kiểm tra vi phạm `fetch(` trực tiếp:

```bash
rg "fetch\(" apps/web/src
```

Kết quả mong muốn: Chỉ xuất hiện trong `apps/web/src/lib/api-client.ts`.
