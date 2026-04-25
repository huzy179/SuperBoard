# Search Service 🔍

Dịch vụ xử lý việc đánh chỉ mục (indexing) và tìm kiếm dữ liệu trong SuperBoard.

## Công Nghệ Sử Dụng

- **Framework**: NestJS
- **Hàng đợi**: BullMQ
- **Dữ liệu**: PostgreSQL (Full-text search) / Vector DB (Semantic search)

## Chức Năng Chính

- Đánh chỉ mục nội dung các Task, Comment và Tài liệu.
- Cung cấp API tìm kiếm nhanh chóng và chính xác.
- Đồng bộ dữ liệu tìm kiếm khi có thay đổi từ API chính.

## Cách Hoạt Động

Lắng nghe các thay đổi dữ liệu qua hàng đợi và cập nhật chỉ mục tìm kiếm tương ứng.
