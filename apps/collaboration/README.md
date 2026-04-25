# Collaboration Service (Real-time) 💬

Dịch vụ xử lý các tương tác thời gian thực (real-time) giữa các người dùng.

## Công Nghệ Sử Dụng

- **Framework**: NestJS
- **Giao thức**: WebSockets (Socket.io)
- **Adapter**: Redis Adapter (Hỗ trợ scale ngang)

## Chức Năng Chính

- Chat trực tuyến giữa các thành viên.
- Thông báo sự kiện tức thì (Ví dụ: thông báo nhảy lên ngay khi có người gán task).
- Trạng thái online/offline của người dùng.

## Cấu Trúc

Sử dụng các "Rooms" của Socket.io để phân tách dữ liệu theo Workspace và Project, đảm bảo an toàn thông tin.
