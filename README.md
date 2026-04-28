# SuperBoard 🚀

Chào mừng bạn đến với **SuperBoard** - Một nền tảng quản lý công việc hiện đại phong cách Jira, được thiết kế tối ưu cho mục đích **học tập** và **mở rộng hệ thống**.

Dự án này là minh chứng cho việc áp dụng các kiến trúc phần mềm tiên tiến vào một sản phẩm thực tế, giúp bạn làm chủ từ Frontend, Backend cho đến các dịch vụ AI thông minh.

---

## 📖 Tài Liệu Quan Trọng

Để hiểu rõ và bắt đầu với dự án, vui lòng đọc các tài liệu hướng dẫn sau (đã được chuẩn hóa tiếng Việt):

- 🏗️ **[Kiến Trúc Hệ Thống (ARCHITECT.md)](./ARCHITECT.md)**: Giải thích chi tiết về Tech Stack, cấu trúc thư mục và cách hệ thống vận hành.
- 🚀 **[Lộ Trình Học Tập Nâng Cao (ADVANCED_LEARNING.md)](./ADVANCED_LEARNING.md)**: Các chủ đề và bài tập thực hành để nâng cao kỹ năng lập trình.
- 🛠️ **[Nhật Ký Phát Triển (Worklog)](./worklog/worklog.md)**: Theo dõi các cập nhật và thay đổi mới nhất của dự án.

---

## 🛠️ Tính Năng Nổi Bật

- **Quản lý Workspace & Project**: Phân quyền và tổ chức công việc chuyên nghiệp.
- **Bảng Công Việc (Jira-style)**: Giao diện kéo thả, quản lý task linh hoạt.
- **Hệ Thống Tự Động Hóa (Automation)**: Tự động xử lý các tác vụ lặp đi lặp lại.
- **Tích Hợp AI**: Tìm kiếm ngữ nghĩa và hỗ trợ quản lý task thông minh.
- **Thông Báo Thời Gian Thực**: Cập nhật tức thì qua WebSockets và Email.

---

## 🚀 Bắt Đầu Nhanh

### 1. Yêu cầu hệ thống

- Node.js >= 20.11
- Docker & Docker Compose

### 2. Cài đặt & Khởi chạy

```bash
# Cài đặt dependencies
npm install

# Khởi chạy hạ tầng (Database, Redis, MailHog)
npm run dev:infra

# (Tuỳ chọn) Chạy full stack bằng Docker (API/Web trong container)
npm run dev:docker

# Khởi tạo Database
npm run db:migrate
npm run db:seed

# Chạy toàn bộ ứng dụng (API, Web, AI Services)
npm run dev
```

---

## 🏗️ Cấu Trúc Monorepo

Dự án sử dụng **Turborepo** để quản lý các ứng dụng:

- [`/apps/web`](./apps/web): Frontend chính (Next.js).
- [`/apps/api`](./apps/api): Backend cốt lõi (NestJS).
- [`/apps/automation`](./apps/automation): Xử lý tự động hóa (BullMQ).
- [`/apps/collaboration`](./apps/collaboration): Kết nối thời gian thực (Socket.io).
- [`/apps/collab-service`](./apps/collab-service): Soạn thảo cộng tác (Yjs).
- [`/apps/notification`](./apps/notification): Dịch vụ thông báo (Email, Push).
- [`/apps/search`](./apps/search): Dịch vụ tìm kiếm dữ liệu.
- [`/apps/ai-service`](./apps/ai-service): Dịch vụ trí tuệ nhân tạo (FastAPI).
- [`/packages/shared`](./packages/shared): Định nghĩa dữ liệu và code dùng chung.

---

_SuperBoard - Code for learning, built for scale._
_Duy trì và phát triển bởi cộng đồng học tập công nghệ._
