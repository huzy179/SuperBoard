# TODO

> Kế hoạch phía trước. Ưu tiên rõ, scope nhỏ, ship được.

---

## Tiếp theo — Jira Core Completion (P0)

Mục tiêu: hoàn thiện Jira MVP đủ dùng thật, không còn thiếu gì cơ bản.

### Backend

- [x] ~~Task history qua `TaskEvent` — ai làm gì, lúc nào~~ (done v1.4)
- [x] ~~Filter/sort nền tảng: status, priority, assignee, dueDate~~ (done v0.9)
- [x] ~~Chốt API contract Jira v1 (DTO/request/response/error format)~~ (done v1.5)
- [x] ~~Dọn semantics archive: quyết định `isArchived` vs `deletedAt` thuần~~ (done v1.6)
- [x] ~~Bulk API endpoint (status/assignee/delete) để tránh loop N requests từ FE~~ (done v1.2)

### Frontend

- [x] ~~Đồng bộ contract FE ↔ BE qua `packages/shared`~~ (done v0.9)
- [x] ~~Filter/sort UI cho board + list~~ (done v0.9)
- [x] ~~Bulk actions + undo UX cho board/list~~ (done v1.1)
- [x] ~~Persist filter/search/viewMode vào URL query params~~ (done v1.2)
- [x] ~~Mock fallback cho endpoint BE chưa xong~~ (done v1.19)
- [x] ~~Task ordering thực sự cho board (fractional index) + drag reorder cùng cột~~ (done v1.20)

### Integration

- [ ] E2E flow hoàn chỉnh: tạo project → tạo task → kéo task → xem lịch sử
- [ ] Smoke test toàn bộ Jira v1 flow

---

## Sau đó — Nâng cấp nền tảng (P1)

Mục tiêu: từ "chạy được" lên "dùng được nghiêm túc".

### Real-time

- [x] ~~Socket.io task update đa user — kéo task → tất cả người xem board thấy ngay~~ (done v1.21)
- [x] ~~Presence trên board — avatar ai đang xem~~ (done v1.9)
- [x] ~~Đồng bộ realtime multi-tab cho bulk actions + project/comments~~ (done v1.2)

### UX Polish

- [ ] Subtasks — nested 1 level, parent hiện progress
- [x] ~~Calendar view — tasks theo month/week~~ (done v1.8)

---

## Backlog — Để sau khi core ổn

- [ ] Auth nâng cao: social login, MFA/TOTP, session UI
- [ ] Slack module: team chat real-time
- [ ] Notion module: docs + block editor
- [ ] AI service integration
- [ ] Deploy production
- [ ] Test integration mở rộng
