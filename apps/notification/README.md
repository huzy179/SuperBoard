# Notification Service 🔔

Dịch vụ chuyên trách việc gửi thông báo đến người dùng qua nhiều kênh khác nhau.

## Công Nghệ Sử Dụng

- **Framework**: NestJS
- **Hàng đợi**: BullMQ
- **Email**: Nodemailer (Tích hợp MailHog cho môi trường dev)

## Chức Năng Chính

- Gửi Email thông báo khi có thay đổi quan trọng (giao task, mời vào workspace).
- Quản lý các loại thông báo in-app.
- Xử lý retry nếu việc gửi thông báo gặp lỗi.

## Cách Hoạt Động

Nhận các yêu cầu gửi thông báo qua BullMQ queue, giúp tách biệt logic gửi mail (thường chậm) khỏi luồng xử lý API chính.
