# Kiến Trúc Hệ Thống SuperBoard 🏗️

Tài liệu này mô tả chi tiết cách SuperBoard được xây dựng, các công nghệ sử dụng và cách các thành phần phối hợp với nhau. Mục tiêu là giúp bạn hiểu nhanh cấu trúc để có thể bắt đầu phát triển hoặc học tập.

---

## 1. Tổng Quan Kiến Trúc (High-Level)

SuperBoard được xây dựng theo mô hình **Monorepo** (một kho chứa nhiều ứng dụng). Chúng ta sử dụng **Turborepo** để quản lý việc chạy và build các ứng dụng này một cách hiệu quả.

Hệ thống bao gồm các thành phần chính:

- **Frontend (Web)**: Giao diện người dùng hiện đại, tương tác mượt mà.
- **Backend (API)**: Trung tâm xử lý logic nghiệp vụ và dữ liệu.
- **Microservices**: Các dịch vụ nhỏ chuyên biệt (Automation, AI, Collaboration).
- **Shared Packages**: Các thư viện dùng chung cho toàn bộ dự án.

---

## 2. Công Nghệ Sử Dụng (Tech Stack)

### Core

- **Quản lý Monorepo**: [Turborepo](https://turbo.build/)
- **Ngôn ngữ**: TypeScript (Đảm bảo an toàn kiểu dữ liệu)

### Backend (Dịch vụ chính)

- **Framework**: [NestJS](https://nestjs.com/) (Kiến trúc modular, dễ mở rộng)
- **ORM**: [Prisma](https://www.prisma.io/) (Làm việc với Database một cách hiện đại)
- **Database**: PostgreSQL
- **Hàng đợi (Queue)**: [BullMQ](https://docs.bullmq.io/) + Redis (Xử lý các tác vụ chạy ngầm như gửi email, automation)

### Frontend

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: Vanilla CSS & TailwindCSS
- **Quản lý dữ liệu**: [TanStack Query (React Query)](https://tanstack.com/query/latest) - Giúp đồng bộ dữ liệu server và client cực nhanh.

### AI & Services khác

- **AI Service**: Python ([FastAPI](https://fastapi.tiangolo.com/)) - Xử lý các tính năng thông minh như tìm kiếm ngữ nghĩa, tóm tắt task.
- **Real-time**: WebSockets (Cho phép chat và cập nhật dữ liệu tức thì).

---

## 3. Cấu Trúc Thư Mục 📂

```text
.
├── apps/                   # Các ứng dụng chính
│   ├── api/                # Backend chính (NestJS)
│   ├── web/                # Frontend chính (Next.js)
│   ├── ai-service/         # Dịch vụ AI (Python/FastAPI)
│   ├── automation/         # Xử lý tự động hóa (NestJS + BullMQ)
│   ├── collaboration/      # Tính năng cộng tác thời gian thực
│   └── notification/       # Dịch vụ gửi thông báo (Email, Push)
├── packages/               # Các thư viện dùng chung
│   ├── shared/             # Định nghĩa dữ liệu (DTOs) và Types dùng cho cả Web & API
│   └── config-ts/          # Cấu hình TypeScript dùng chung
├── docker/                 # Cấu hình hạ tầng (Database, Redis, MailHog)
└── scripts/                # Các script hỗ trợ setup và bảo trì dự án
```

---

## 4. Các Nguyên Tắc Thiết Kế (Key Patterns)

### Kiến Trúc Đa Tầng (Layered Architecture) o API

Mọi logic trong `apps/api` thường đi qua 3 tầng:

1. **Controller**: Tiếp nhận yêu cầu từ người dùng (HTTP Request).
2. **Service**: Xử lý logic nghiệp vụ chính (Ví dụ: kiểm tra quyền, tính toán dữ liệu).
3. **Prisma/Repository**: Tương tác trực tiếp với Database.

### Shared DTOs (Data Transfer Objects)

Chúng ta định nghĩa kiểu dữ liệu trong `packages/shared`. Điều này giúp đảm bảo khi Backend thay đổi cấu trúc dữ liệu, Frontend sẽ nhận được thông báo lỗi ngay lập tức, tránh được các lỗi "vặt".

### Optimistic UI

Ở phía Frontend, khi bạn thực hiện một hành động (như chuyển trạng thái task), giao diện sẽ cập nhật **ngay lập tức** trước khi server phản hồi. Nếu có lỗi, hệ thống sẽ tự động quay lại trạng thái cũ (rollback). Điều này tạo cảm giác ứng dụng cực kỳ nhanh.

---

## 5. Luồng Dữ Liệu Ví Dụ

1. Người dùng nhấn "Hoàn thành Task" trên giao diện **Web**.
2. **Web** gửi yêu cầu đến **API** đồng thời cập nhật giao diện ngay lập tức (Optimistic UI).
3. **API** kiểm tra quyền hạn, lưu vào Database qua **Prisma**.
4. **API** đẩy một sự kiện vào **Redis (BullMQ)**.
5. **Automation Service** nhận sự kiện, tự động gửi thông báo qua **Notification Service**.

---

_Tài liệu này nhằm giúp bạn có cái nhìn tổng quát. Để đi sâu vào từng phần, hãy đọc README trong từng thư mục con._
