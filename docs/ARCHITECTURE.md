# Kiến Trúc Hệ Thống SuperBoard 🏗️

Tài liệu này cung cấp cái nhìn sâu sắc về cách SuperBoard được thiết kế và vận hành. Đây là một hệ thống **Modern Monorepo** với kiến trúc phân tầng rõ rệt, đảm bảo tính mở rộng và dễ bảo trì.

---

## 1. Mô Hình Monorepo (Turborepo) 🚀

SuperBoard không phải là một project đơn lẻ, mà là một hệ sinh thái các ứng dụng phối hợp với nhau. Chúng ta sử dụng **Turborepo** để:

- **Tối ưu hóa Build & Test:** Chỉ chạy lại những phần có thay đổi.
- **Quản lý Dependencies:** Đồng bộ hóa phiên bản thư viện trên toàn bộ các app.
- **Chia sẻ mã nguồn:** Tái sử dụng logic nghiệp vụ và kiểu dữ liệu dễ dàng qua thư mục `packages/`.

---

## 2. Chi Tiết Các Thành Phần (Apps & Services) 📂

### 🏛️ Backend Ecosystem (NestJS & Python)

- **API chính (`apps/api`):** Trái tim của hệ thống. Xử lý Auth, Workspace, Project, Task. Sử dụng **Prisma** làm ORM để tương tác với PostgreSQL.
- **Automation Service (`apps/automation`):** Chuyên trách các "Rules" tự động. Tách biệt khỏi API chính để không ảnh hưởng đến hiệu năng khi xử lý logic phức tạp.
- **Notification Service (`apps/notification`):** Quản lý luồng gửi Email và thông báo In-app thông qua hàng đợi **BullMQ**.
- **Collaboration Service (`apps/collab-service`):** Dịch vụ đặc thù cho việc soạn thảo đồng thời (Notion-style), sử dụng **Hocuspocus** và thuật toán **Yjs (CRDT)**.
- **Real-time Engine (`apps/collaboration`):** Xử lý kết nối Socket.io, đồng bộ hóa trạng thái tức thì giữa các người dùng.
- **AI Service (`apps/ai-service`):** Microservice Python (FastAPI) cung cấp khả năng tìm kiếm ngữ nghĩa và tóm tắt thông tin qua LLMs.

### 🎨 Frontend (Next.js App Router)

- **Kiến trúc Feature-based:** Mã nguồn trong `apps/web` được tổ chức theo tính năng (Features) thay vì loại file, giúp quản lý code dễ dàng khi dự án phình to.
- **Data Layer:** Sử dụng **TanStack Query** làm lớp đệm dữ liệu giữa UI và Server, hỗ trợ Cache và Optimistic Updates mạnh mẽ.

---

## 3. Các Nguyên Tắc Kiến Trúc Cốt Lõi 🛠️

### A. Quy tắc Ranh giới (Boundary Rules)

- **Shared Contracts:** Mọi giao tiếp dữ liệu giữa Web và API đều phải thông qua các DTO được định nghĩa trong `packages/shared`. Điều này đảm bảo "Type-safety" tuyệt đối.
- **Domain Decoupling:** Các module (như Task, Chat, Auth) được thiết kế để ít phụ thuộc trực tiếp vào nhau nhất có thể, thường giao tiếp qua Sự kiện (Events).

### B. Kiến Trúc Đa Tầng (Layered Architecture)

1. **Controller Layer:** Chỉ tiếp nhận Request, Validate dữ liệu sơ bộ và gọi Service.
2. **Business Logic Layer (Service):** Nơi thực hiện các quy tắc nghiệp vụ, kiểm tra quyền hạn.
3. **Data Access Layer (Prisma):** Tương tác với Database.

---

## 4. Backend Directory Structure Standardization 📂

Tất cả các dịch vụ backend đều tuân theo cấu trúc thư mục chuẩn hóa để đảm bảo tính nhất quán và dễ bảo trì.

### Standardized Directory Structure

```
src/
├── controllers/              # HTTP request handlers
│   ├── *.controller.ts      # Controller files
│   └── dto/                 # Data Transfer Objects
├── services/                # Business logic layer
│   ├── *.service.ts         # Service implementations
│   └── interfaces/          # Service interfaces
├── modules/                 # NestJS modules
│   ├── *.module.ts          # Module definitions
├── common/                  # Shared utilities and helpers
├── config/                  # Configuration management
├── __tests__/               # Test files (Unit, Integration, Property)
├── app.module.ts            # Root application module
└── main.ts                  # Application entry point
```

### File Naming Conventions

- **Controllers**: `{feature}.controller.ts` (e.g., `user.controller.ts`)
- **Services**: `{feature}.service.ts` (e.g., `user.service.ts`)
- **Modules**: `{feature}.module.ts` (e.g., `user.module.ts`)
- **DTOs**: `{feature}.dto.ts` or `create-{feature}.dto.ts`

---

## 5. Luồng Vận Hành Thực Tế 🔄

1. **Thao tác người dùng:** Người dùng nhấn "Hoàn thành Task".
2. **Optimistic Update:** Frontend hiển thị Task đã hoàn thành ngay lập tức.
3. **API Processing:** API nhận yêu cầu, cập nhật Database qua Prisma Transaction.
4. **Event Dispatch:** API đẩy sự kiện `task.completed` vào Redis.
5. **Background Workers:** `Automation Service`, `Notification Service`, `Search Service` xử lý các tác vụ liên quan.

---

_Để biết thêm chi tiết về lộ trình phát triển kỹ thuật, vui lòng đọc [ADVANCED_LEARNING.md](./ADVANCED_LEARNING.md)._
