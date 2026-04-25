# Collaborative Editing Service (Hocuspocus) 📝

Dịch vụ chuyên biệt cho việc soạn thảo tài liệu cộng tác thời gian thực (như Notion hoặc Google Docs).

## Công Nghệ Sử Dụng

- **Server**: Hocuspocus (by Tiptap)
- **Engine**: Yjs (CRDTs - Conflict-free Replicated Data Types)
- **Database**: PostgreSQL (Prisma)

## Chức Năng Chính

- Cho phép nhiều người dùng cùng chỉnh sửa một tài liệu cùng lúc mà không bị xung đột dữ liệu.
- Lưu trữ lịch sử chỉnh sửa tài liệu.
- Đồng bộ hóa trạng thái con trỏ (cursor) của các người dùng.

## Cách Hoạt Động

Sử dụng thuật toán CRDT để tự động giải quyết các xung đột khi nhiều người cùng gõ văn bản, mang lại trải nghiệm mượt mà tuyệt đối.
