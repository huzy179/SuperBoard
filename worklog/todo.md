# TODO

> Kế hoạch phía trước. Ưu tiên rõ, scope nhỏ, ship được.

---

## Tiếp theo — Jira Core Completion (P0)

Mục tiêu: hoàn thiện Jira MVP đủ dùng thật, không còn thiếu gì cơ bản.

### Backend

- [ ] Task history qua `TaskEvent` — ai làm gì, lúc nào
- [ ] Filter/sort nền tảng: status, priority, assignee, dueDate
- [ ] Chốt API contract Jira v1 (DTO/request/response/error format)
- [ ] Dọn semantics archive: quyết định `isArchived` vs `deletedAt` thuần

### Frontend

- [ ] Đồng bộ contract FE ↔ BE qua `packages/shared`
- [ ] Filter/sort UI cho board + list
- [ ] Mock fallback cho endpoint BE chưa xong

### Integration

- [ ] E2E flow hoàn chỉnh: tạo project → tạo task → kéo task → xem lịch sử
- [ ] Smoke test toàn bộ Jira v1 flow

---

## Sau đó — Nâng cấp nền tảng (P1)

Mục tiêu: từ "chạy được" lên "dùng được nghiêm túc".

### Data Model

- [ ] Hoàn thiện Prisma schema đầy đủ: User fields, Role/Permission, TaskEvent, Comment, Attachment, Notification
- [ ] Ràng buộc: relation, unique constraints, indexes, enums
- [ ] Migration sạch + seed data nền (roles, permissions, workspace/project/task mẫu)

### Real-time

- [ ] Socket.io task update — kéo task → tất cả người xem board thấy ngay
- [ ] Presence trên board — avatar ai đang xem

### UX Polish

- [ ] Task labels/tags — tạo tag màu per workspace
- [ ] Subtasks — nested 1 level, parent hiện progress
- [ ] Calendar view — tasks theo month/week

---

## Backlog — Để sau khi core ổn

- [ ] Auth nâng cao: social login, MFA/TOTP, session UI
- [ ] Slack module: team chat real-time
- [ ] Notion module: docs + block editor
- [ ] AI service integration
- [ ] Deploy production
- [ ] Test integration mở rộng
