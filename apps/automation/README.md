# Automation Service ⚙️

Dịch vụ xử lý các quy tắc tự động hóa (Automation Rules) trong SuperBoard.

## Công Nghệ Sử Dụng

- **Framework**: NestJS
- **Hàng đợi**: BullMQ
- **Lưu trữ tạm**: Redis

## Chức Năng Chính

- Lắng nghe các sự kiện từ hệ thống (Ví dụ: Task được chuyển trạng thái).
- Thực thi các hành động tự động (Ví dụ: Tự động giao task cho một người khi task chuyển sang "In Review").
- Xử lý các tác vụ lặp lại theo lịch trình.

## Cách Hoạt Động

Service này chạy tách biệt và lắng nghe các job được đẩy vào Redis từ API chính, đảm bảo không làm chậm các thao tác trực tiếp của người dùng.
