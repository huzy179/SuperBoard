# SuperBoard Frontend 💻

Giao diện người dùng chính của SuperBoard, được xây dựng với mục tiêu mang lại trải nghiệm mượt mà, tốc độ và hiện đại như Jira.

## Công Nghệ Sử Dụng

- **Framework**: Next.js (App Router)
- **Quản lý dữ liệu**: TanStack Query (React Query)
- **Styling**: Vanilla CSS, TailwindCSS, Lucide Icons.
- **State Management**: URL State + Context API.

## Chức Năng Chính

- Giao diện kéo thả Kanban Board.
- Quản lý danh sách công việc (List View), Lịch (Calendar View).
- Chế độ tối (Dark Mode) và giao diện phản hồi (Responsive).
- Tích hợp thời gian thực (Real-time updates).

## Cấu Trúc Thư Mục

- `app/`: Các trang và layouts (Next.js App Router).
- `components/ui/`: Các thành phần giao diện dùng chung.
- `features/`: Logic và UI theo từng tính năng (Task, Project, Chat...).
- `hooks/`: Các custom hooks xử lý logic nghiệp vụ phía frontend.

## Cách Chạy (Standalone)

```bash
npm run dev
```

_Hoặc chạy từ root monorepo: `npm run dev --workspace @superboard/web`_
