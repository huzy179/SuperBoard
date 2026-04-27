# SuperBoard Frontend 💻

Giao diện người dùng chính của SuperBoard — xây dựng trên **Next.js 16 App Router**, hướng đến trải nghiệm mượt mà, tốc độ cao và hiện đại như Jira.

---

## 🛠️ Tech Stack

| Hạng mục         | Công nghệ                                                |
| ---------------- | -------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, React 19)                        |
| Styling          | TailwindCSS v4, CSS Variables                            |
| State Management | Zustand (client state), TanStack Query v5 (server state) |
| Form             | React Hook Form + Zod                                    |
| Drag & Drop      | @dnd-kit/core, @dnd-kit/sortable                         |
| Rich Text Editor | Tiptap v3 (với Collaboration extension)                  |
| Realtime         | Socket.io Client, Yjs + y-websocket (CRDT)               |
| Charts           | Recharts                                                 |
| Animation        | Framer Motion                                            |
| Icons            | Lucide React                                             |
| Testing (Unit)   | Node.js built-in test runner + tsx                       |
| Testing (E2E)    | Playwright                                               |

---

## 📁 Cấu Trúc Thư Mục

```
apps/web/src/
├── app/                        # Next.js App Router
│   ├── (public)/               # Các trang không cần đăng nhập
│   │   ├── login/              # Trang đăng nhập
│   │   ├── invitation/         # Chấp nhận lời mời workspace
│   │   ├── invite/             # Trang mời thành viên
│   │   └── share/              # Trang chia sẻ công khai
│   ├── (private)/              # Các trang yêu cầu xác thực
│   │   ├── dashboard/          # Tổng quan công việc
│   │   ├── jira/               # Bảng Kanban & quản lý task
│   │   ├── automation/         # Quản lý quy tắc tự động hóa
│   │   ├── chat/               # Chat nội bộ
│   │   ├── docs/               # Soạn thảo tài liệu cộng tác
│   │   └── settings/           # Cài đặt workspace & tài khoản
│   ├── globals.css             # CSS toàn cục
│   ├── theme.css               # CSS variables cho theme
│   └── layout.tsx              # Root layout
│
├── components/
│   ├── ui/                     # Các component UI dùng chung (Button, Modal, ...)
│   ├── layout/                 # Shell layout (AppFrame, Sidebar, Header)
│   ├── guards/                 # Route guards (PrivateRouteGuard)
│   └── providers/              # Context providers (QueryClient, Theme, ...)
│
├── features/                   # Logic & UI theo từng nhóm tính năng
│   ├── operations/             # Nghiệp vụ cốt lõi
│   │   ├── board/              # Kanban board
│   │   ├── task/               # Chi tiết task
│   │   ├── project/            # Quản lý project
│   │   ├── workflow/           # Cấu hình workflow
│   │   ├── dashboard/          # Dashboard widgets
│   │   └── reports/            # Báo cáo & thống kê
│   ├── collaboration/          # Cộng tác nhóm
│   │   ├── chat/               # Chat realtime
│   │   ├── docs/               # Soạn thảo tài liệu (Yjs CRDT)
│   │   └── qa/                 # Hỏi đáp nội bộ
│   ├── intelligence/           # Tính năng AI
│   │   ├── ai/                 # AI assistant & gợi ý
│   │   ├── executive/          # Tóm tắt & phân tích thông minh
│   │   └── knowledge/          # Tìm kiếm ngữ nghĩa
│   ├── specialized/            # Tính năng chuyên biệt
│   │   ├── automation/         # UI quản lý automation rules
│   │   ├── connect/            # Tích hợp bên ngoài
│   │   └── talent/             # Quản lý nhân sự
│   └── system/                 # Hệ thống & hạ tầng FE
│       ├── auth/               # Xác thực (login, session)
│       ├── workspace/          # Quản lý workspace
│       ├── user/               # Hồ sơ người dùng
│       ├── notifications/      # Thông báo realtime
│       └── search/             # Tìm kiếm toàn cục
│
└── lib/                        # Tiện ích & cấu hình dùng chung
    ├── api/                    # API modules theo domain
    ├── hooks/                  # Custom hooks dùng chung
    ├── realtime/               # Socket.io & Yjs setup
    ├── constants/              # Hằng số toàn cục
    ├── api-client.ts           # Axios/fetch wrapper
    ├── query-keys.ts           # TanStack Query key factory
    ├── navigation.ts           # Route constants & nav items
    ├── utils.ts                # Hàm tiện ích chung
    └── format-date.ts          # Định dạng ngày tháng
```

---

## 🏛️ Kiến Trúc

### Route Groups

- `(public)/` — layout không cần auth, dùng cho login, invitation, share link
- `(private)/` — layout có auth gate thông qua `PrivateRouteGuard`

### Import Alias

Toàn bộ import nội bộ dùng alias `@/`:

```ts
import { Button } from '@/components/ui/button';
import { useTaskQuery } from '@/features/operations/task/hooks/use-task-query';
```

### State Management

- **Server state** (API data): TanStack Query — cache, refetch, optimistic updates
- **Client state** (UI state): Zustand — board filters, sidebar, modal state
- **URL state**: `useSearchParams` — filter, sort, pagination

### Realtime

- **Socket.io** — thông báo, cập nhật task, presence
- **Yjs + y-websocket** — CRDT cho soạn thảo tài liệu cộng tác (Tiptap Collaboration)

---

## 🚀 Cách Chạy

### Standalone

```bash
# Từ thư mục apps/web
npm run dev        # Dev server tại http://localhost:3000
npm run build      # Build production
npm run start      # Chạy production build
```

### Từ root monorepo

```bash
npm run dev --workspace @superboard/web
```

### Yêu cầu

Cần có API backend đang chạy. Xem hướng dẫn khởi chạy đầy đủ tại [README gốc](../../README.md).

---

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

Dùng Node.js built-in test runner với `tsx`. Test files đặt cạnh source với đuôi `.test.ts`.

### E2E Tests (Playwright)

```bash
# Chạy toàn bộ E2E tests
npx playwright test

# Xem báo cáo HTML
npx playwright show-report
```

E2E tests nằm trong thư mục `e2e/`, chạy trên Chromium với base URL `http://localhost:3333`.

### Type Check & Lint

```bash
npm run typecheck   # Kiểm tra TypeScript
npm run lint        # ESLint
```

---

## ⚙️ Biến Môi Trường

Sao chép `.env.example` thành `.env.local` và điền các giá trị:

```bash
cp .env.example .env.local
```

Xem file `.env.example` để biết danh sách đầy đủ các biến cần thiết.

---

_Phần của monorepo SuperBoard — xem [ARCHITECT.md](../../ARCHITECT.md) để hiểu toàn bộ hệ thống._
