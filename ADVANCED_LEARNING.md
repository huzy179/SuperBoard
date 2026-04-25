# Lộ Trình Học Tập Nâng Cao Cùng SuperBoard 🚀

Chào mừng bạn đến với phần thú vị nhất! SuperBoard không chỉ là một ứng dụng quản lý công việc, mà là một "phòng thí nghiệm" để bạn thực hành các kỹ thuật lập trình hiện đại.

Dưới đây là các chủ đề bạn có thể đào sâu để nâng cấp kỹ năng từ một lập trình viên cơ bản lên chuyên nghiệp (Production-grade).

---

## 🛑 Giai Đoạn 1: Làm Chủ Nền Tảng

### 1. Monorepo với Turborepo

- **Mục tiêu**: Hiểu cách quản lý nhiều project trong một repo.
- **Thực hành**: Thử tạo một package mới trong thư mục `packages/` và sử dụng nó trong cả `apps/api` và `apps/web`.
- **Câu hỏi**: Tại sao dùng Monorepo lại giúp team phát triển nhanh hơn?

### 2. Type Safety Tuyệt Đối

- **Mục tiêu**: Không bao giờ dùng `any` trong TypeScript.
- **Thực hành**: Sử dụng thư viện Validation (như Zod hoặc Class-validator) để đảm bảo dữ liệu từ người dùng luôn đúng cấu trúc trước khi xử lý.

---

## 🔥 Giai Đoạn 2: Nâng Cao Hiệu Năng & Trải Nghiệm

### 3. Real-time Collaboration (Cộng tác tức thời)

- **Mục tiêu**: Hiểu về WebSockets và SSE.
- **Thực hành**: Cài đặt tính năng "Typing Indicator" (hiển thị ai đang gõ comment) hoặc thông báo nhảy lên ngay lập tức khi có người giao task cho bạn.

### 4. Caching & Background Jobs

- **Mục tiêu**: Làm ứng dụng nhanh hơn bằng cách đẩy các tác vụ nặng ra sau.
- **Thực hành**:
  - Dùng **Redis** để lưu các kết quả tính toán phức tạp (như báo cáo tiến độ dự án).
  - Dùng **BullMQ** để xử lý gửi Email hàng loạt mà không làm nghẽn API chính.

### 5. Search Thông Minh (Semantic Search)

- **Mục tiêu**: Tìm kiếm không chỉ theo từ khóa mà theo ý nghĩa.
- **Thực hành**: Tìm hiểu cách đưa dữ liệu task vào một **Vector Database** và dùng AI để tìm kiếm. (Xem module `apps/ai-service`).

---

## 🛡️ Giai Đoạn 3: Hệ Thống Chuyên Nghiệp

### 6. RBAC & Security (Phân quyền & Bảo mật)

- **Mục tiêu**: Quản lý quyền truy cập phức tạp.
- **Thực hành**: Thiết kế hệ thống phân quyền sao cho: `Viewer` chỉ được xem, `Member` được tạo task, và `Admin` được mời người khác vào Workspace.

### 7. Observability (Khả năng quan sát)

- **Mục tiêu**: Biết chuyện gì đang xảy ra khi hệ thống gặp lỗi.
- **Thực hành**:
  - Cài đặt Logging tập trung (ví dụ: dùng Pino).
  - Gắn `Correlation ID` vào mỗi request để theo dõi luồng đi của dữ liệu qua nhiều service.

---

## 🛠️ Bài Tập Gợi Ý (Challenge dành cho bạn)

1. **Dễ**: Thêm tính năng "Soft Delete" cho Task (Khi xóa không mất hẳn trong DB mà chỉ đánh dấu đã xóa).
2. **Trung bình**: Cài đặt tính năng `@mention` trong comment và gửi thông báo cho người được nhắc đến.
3. **Khó**: Xây dựng tính năng "Activity Timeline" (nhật ký thay đổi) cho từng Task bằng cách sử dụng **Event Sourcing** đơn giản.

---

## 📚 Tài liệu tham khảo nên đọc

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js App Router Guide](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Twelve-Factor App](https://12factor.net/vi/) (Nguyên tắc xây dựng ứng dụng hiện đại)

---

_Hãy nhớ: Cách học tốt nhất là bắt tay vào code. Chúc bạn có những trải nghiệm thú vị với SuperBoard!_
