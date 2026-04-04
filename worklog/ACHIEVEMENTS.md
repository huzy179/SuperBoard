# SuperBoard: Advanced Engineering Achievements & Learning Path

Tài liệu này tóm tắt các giải pháp kỹ thuật phức tạp và những kiến thức quan trọng nhất đã được triển khai trong dự án SuperBoard, vượt qua các thao tác CRUD cơ bản.

---

## 1. Hệ thống Workflow Động (Dynamic Workflow Engine)

Thay vì sử dụng các trạng thái cứng (hardcoded), SuperBoard xây dựng một engine workflow linh hoạt.

- **Trạng thái dựa trên Category**: Quy định các nhóm trạng thái (`todo`, `in_progress`, `done`, `blocked`) để tự động áp dụng logic hiển thị và icon đồng bộ trên toàn hệ thống.
- **Ma trận chuyển trạng thái (Transition Matrix)**: Kiểm soát nghiệp vụ bằng cách quy định rõ trạng thái A chỉ được phép chuyển sang trạng thái B hoặc C.
- **Validation Proactive**: UI tự động lọc các option trong dropdown hoặc hiển thị chỉ báo xanh/đỏ khi kéo thả (drag-and-drop) dựa trên ma trận chuyển đổi, giúp ngăn chặn lỗi nghiệp vụ ngay tại "cửa ngõ".

## 2. Thuật toán Sắp xếp Vị trí (Fractional Positioning)

Để hỗ trợ kéo thả mượt mà trên Board mà không phải cập nhật lại hàng loạt record (như dùng `order` integer).

- **Vị trí số thực (Float/Fractional)**: Vị trí của một task luôn là trung điểm giữa task trên và task dưới.
- **Cơ chế Rebalancing**: Tự động phát hiện khi khoảng cách giữa hai task trở nên quá nhỏ (do kéo thả quá nhiều lần vào cùng một vị trí) và thực hiện sắp xếp lại (re-index) toàn cột để tránh sai số dấu phẩy động.

## 3. Đồng bộ Thời gian thực & Đa luồng (Real-time & Sync)

Giải quyết bài toán trải nghiệm người dùng trong môi trường cộng tác.

- **WebSockets (Socket.io)**: Cập nhật trạng thái task, sự hiện diện của người dùng (Presence - ai đang xem project) theo thời gian thực.
- **Cross-tab Synchronization**: Sử dụng `BroadcastChannel` của trình duyệt để đồng bộ dữ liệu giữa các tab khác nhau của cùng một người dùng mà không cần gọi lại API (Refetch), tối ưu hóa băng thông và tài nguyên.
- **Visibility-aware Refetching**: Nhận biết tab nào đang ẩn để trì hoãn việc làm mới dữ liệu, giúp tiết kiệm CPU và Pin.

## 4. Thao tác Hàng loạt & An toàn Dữ liệu (Bulk Ops & Safety UX)

Xử lý dữ liệu lớn một cách an toàn và tinh tế.

- **Atomic Bulk Updates**: Cập nhật đồng thời trạng thái, người thực hiện, độ ưu tiên... cho hàng trăm task chỉ bằng một yêu cầu API duy nhất.
- **Timed Undo & Recovery**: Khi xóa task, hệ thống không xóa ngay mà bắt đầu một chu kỳ "chờ" (Undo grace period). UI hiển thị thanh tiến trình 5 giây, cho phép người dùng khôi phục dữ liệu tức thì nếu lỡ tay bấm nhầm.
- **Concurrent Lock**: Tự động khóa các thao tác kéo thả và chỉnh sửa inline khi một tác vụ hàng loạt (như xóa nhiều task) đang được xử lý để tránh xung đột dữ liệu.

## 5. Kiến trúc Hệ thống & Chất lượng Mã nguồn

- **Monorepo Architecture (Turborepo)**: Quản lý Backend, Frontend và Shared Package trong cùng một kho chứa, giúp đồng bộ hóa DTO (Data Transfer Object) và logic validate (Zod) giữa các tầng.
- **Clean Implementation (Custom Hooks)**: Toàn bộ logic nghiệp vụ phức tạp ở Frontend được tách biệt hoàn toàn khỏi giao diện, nằm trong các hooks chuyên biệt (`use-task-bulk-actions`, `use-project-calendar`, ...).
- **Structured Logging (Pino)**: Hệ thống log có cấu trúc giúp truy vết lỗi nhanh chóng dựa trên `correlationId`, hỗ trợ tốt cho việc vận hành trong tương lai.

---

> **Học hỏi**: Dự án này không chỉ là về việc build một ứng dụng Jira, mà là về cách giải quyết các bài toán về **sự nhất quán dữ liệu**, **trải nghiệm người dùng cộng tác** và **kiến trúc mã nguồn bền vững**.
