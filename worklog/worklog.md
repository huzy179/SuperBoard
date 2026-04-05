# SuperBoard Worklog

Tài liệu này theo dõi tiến độ phát triển của dự án SuperBoard.

---

## 🏃 Đang thực hiện (Doing)

- [ ] **Tiếp theo**: Deploy thực tế lên môi trường staging/production.
- [ ] **Chốt roadmap**: Tập trung vào Jira-first, tránh mở rộng sang các nền tảng khác quá sớm.
- [x] **Jira v1.91**: Hoàn thành Hệ thống Thông báo Email & Quản lý Profile.
- [x] **Cấu trúc lại tài liệu**: Rút gọn và gộp các file .md để dễ dàng theo dõi và học tập.

---

## 📅 Sắp tới (Todo)

- [ ] Cấu hình CI/CD hoàn chỉnh cho deploy tự động.
- [ ] Tích hợp Prometheus/Grafana cho hệ thống monitoring.
- [ ] Nghiên cứu AI Assistant tích hợp trực tiếp vào Board.

---

## ✅ Đã hoàn thành (Done)

### Jira Core MVP

- [x] **v1.88**: Tách chi tiết task (Task Detail) & Subtask handlers.
- [x] **v1.85**: Refactor Calendar State & Project Header Actions.
- [x] **v1.80**: Hỗ trợ Task Attachments (Full Stack).
- [x] **v1.50**: Tách Bulk Actions & Undo timer.
- [x] **v1.20**: Phân quyền (Role-based Guards) & Membership.

### UI/UX & Features

- [x] **Giao diện Kanban**: Kéo thả task mượt mà với Optimistic UI.
- [x] **Email System**: Tích hợp MailHog & Nodemailer cho thông báo.
- [x] **Presence Indicator**: Hiển thị người dùng đang hoạt động thời gian thực.
- [x] **Dashboard**: Thống kê số lượng task theo trạng thái và dự án.

---

_Ghi chú: Các bước thực hiện chi tiết cho từng tính năng có thể xem lại trong lịch sử commit của Git._
