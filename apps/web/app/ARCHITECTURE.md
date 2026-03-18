# Web App Architecture (MVP Base)

## Mục tiêu

Base gọn, dễ đọc, dễ scale mà không sinh quá nhiều file fallback.

## Quy ước route

- Public route: `app/(public)/login/page.tsx`
- Private route: `app/(private)/jira/page.tsx`

> Route URL thực tế vẫn là `/login`, `/jira`.

## Fallback pages

Chỉ dùng fallback ở cấp app (global), **không** tạo theo từng feature trừ khi thực sự cần:

- `app/loading.tsx`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/not-found.tsx`

## Layout

- `app/(public)/layout.tsx`: shell cho public area
- `app/(private)/layout.tsx`: auth gate + shell cho private area
- Guard được tách riêng ở `components/guards/private-route-guard.tsx`
- `components/layout/app-frame.tsx` dùng chung phần frame để tránh lặp layout wrapper
- UI shell component nằm ở `components/layout/*`

## Điều hướng

Route constants và nav items nằm ở `lib/navigation.ts` để tránh hard-code rải rác.

## Import path

- Dùng alias `@/` cho toàn bộ import nội bộ (`@/components`, `@/hooks`, `@/lib`, `@/app`).
- Tránh dùng đường dẫn tương đối dài kiểu `../../..` để dễ refactor khi di chuyển file.
