# SuperBoard Project Guide

Chào mừng bạn đến với **SuperBoard** - một ứng dụng quản lý công việc (Jira-style) được xây dựng với mục tiêu không chỉ là tính năng mà còn là **kiến trúc sạch**, **khả năng mở rộng bản thân** và **trải nghiệm người dùng cao cấp**.

---

## 🎯 Mục tiêu Dự án

SuperBoard được thiết kế để trở thành một Jira MVP mạnh mẽ, dễ bảo trì và dễ mở rộng. Dự án tập trung vào:

1.  **Sự nhất quán dữ liệu**: Đảm bảo trạng thái công việc (status) và quyền hạn (roles) luôn chính xác trên mọi màn hình.
2.  **Trải nghiệm cộng tác**: Phản hồi nhanh (Optimistic UI), thông báo thời gian thực và quản lý tập trung.
3.  **Kiến trúc Codebase**: Sử dụng Monorepo (Turborepo), NestJS (Modular) và Next.js (App Router) để tạo ra một hệ thống bền vững.

---

## ✨ Các Tính năng Chính

- **Quản lý Workspace & Project**: Tạo và cấu hình các không gian làm việc chuyên nghiệp.
- **Jira-style Board & List**: Giao diện kéo thả, quản lý task theo trạng thái, ưu tiên và nhãn.
- **Custom Workflow**: Định nghĩa trạng thái công việc riêng cho từng dự án, tuân thủ strict transition graph.
- **Task Attachments**: Đính kèm tài liệu, hình ảnh vào từng đầu việc.
- **Email Notifications**: Thông báo tự động qua email (MailHog/Nodemailer) khi được giao task hoặc mời vào workspace.
- **User Profiles**: Quản lý thông tin cá nhân và ảnh đại diện chuyên nghiệp.

---

## 📚 Lộ trình Học tập & Hiểu biết Kỹ năng

Nếu bạn muốn học tập từ dự án này, hãy chú ý vào các phần sau:

### 1. Kiến trúc Monorepo & Shared DTOs

Tìm hiểu cách `@superboard/shared` giúp đồng bộ hóa kiểu dữ liệu (TypeScript Types) và logic kiểm tra (Zod) giữa Backend (NestJS) và Frontend (Next.js).

### 2. Logic nghiệp vụ trong Custom Hooks

Xem cách chúng ta tách biệt logic phức tạp khỏi UI trong `apps/web/hooks/`:

- `use-task-bulk-actions`: Quản lý thao tác hàng loạt.
- `use-project-calendar`: Quản lý trạng thái lịch.
- `use-task-edit-panel`: Xử lý form chỉnh sửa task phức tạp.

### 3. Trải nghiệm Người dùng (Optimistic UI)

Tìm hiểu cách `React Query` được sử dụng để cập nhật giao diện ngay lập tức trước khi server phản hồi, mang lại cảm giác ứng dụng cực kỳ mượt mà.

### 4. Quản lý Trạng thái & Governance

Xem cách `NotificationService` và `WorkflowPolicy` kiểm soát luồng dữ liệu và đảm bảo các quy tắc kinh doanh (Business Rules) luôn được thực thi đúng.

---

## 🏆 Các Thành tựu đã Đạt được

- [x] **Jira v1.80**: Task Attachment Support (Full Stack MVP).
- [x] **Jira v1.91**: Email Notification System & Profile Management.
- [x] **Productization Baseline**: Hoàn thiện bộ custom hooks cho toàn bộ logic Jira.

---

_Hành trình của SuperBoard không chỉ là về việc build một ứng dụng, mà còn là học cách giải quyết các bài toán kỹ thuật thực tế một cách chuyên nghiệp._
