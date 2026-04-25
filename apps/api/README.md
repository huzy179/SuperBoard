# Core API Service 🧠

Dịch vụ Backend chính của SuperBoard, xử lý các logic nghiệp vụ cốt lõi, quản lý người dùng, workspace, dự án và công việc.

## Công Nghệ Sử Dụng

- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Xử lý tác vụ**: BullMQ (Redis)
- **Xác thực**: JWT (JSON Web Token)

## Chức Năng Chính

- Quản lý xác thực (Auth) và phân quyền (RBAC).
- Quản lý cấu trúc Workspace, Project và Task.
- API cho việc upload tài liệu và quản lý profile.
- Tích hợp các service khác qua gRPC và BullMQ events.

## Cấu Trúc Thư Mục

- `src/modules/*`: Các module nghiệp vụ (Auth, Task, Project...).
- `prisma/`: Schema và migrations của database.

## Cách Chạy (Standalone)

```bash
npm run dev
```

_Hoặc chạy từ root monorepo: `npm run dev --workspace @superboard/api`_
