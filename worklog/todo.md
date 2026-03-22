# TODO

> Kế hoạch phía trước. Ưu tiên rõ, scope nhỏ, ship được.

---

## Ưu tiên số 1 — Hoàn thiện Jira để dùng thật

Mục tiêu: đóng nốt các khoảng trống còn lại để Jira MVP đủ chắc trước khi nghĩ tới module mới.

### P0 — Chất lượng và độ tin cậy

- [ ] E2E flow hoàn chỉnh cho Jira core: login → project → task lifecycle → comments/history
- [ ] Smoke test manual checklist cho tất cả màn hình chính
- [ ] Chuẩn hoá lại worklog + tài liệu cấu trúc dự án để bám đúng trạng thái codebase hiện tại
- [ ] Refactor các điểm FE đang quá lớn/khó maintain:
  - `apps/web/hooks/use-jira-projects-page.ts`
  - `apps/web/app/(private)/jira/projects/[projectId]/page.tsx`
- [ ] Rà lỗi giao diện mức dùng thật: loading/error/empty/disabled states, mobile layout, keyboard flow cơ bản

### P1 — Productization thực tế

- [ ] Chuẩn bị deploy tối thiểu cho môi trường thật (web + api + postgres + redis trước)
- [ ] Bổ sung error tracking / logging review ở các flow quan trọng
- [ ] Kiểm tra và tinh gọn infra dev: giữ thứ gì đang thật sự dùng, tránh mang quá nhiều service chưa tích hợp
- [ ] Tăng test coverage cho các service/hook quan trọng của Jira

---

## Ưu tiên số 2 — Nền tảng vừa đủ dùng, không over-engineer

Mục tiêu: chỉ thêm hạ tầng khi có nhu cầu thật từ Jira hiện tại.

### Infra / Backend

- [ ] Review lại auth roadmap: tiếp tục dùng JWT hiện tại trước, chưa nhảy sang Keycloak/OIDC nếu chưa có nhu cầu rõ ràng
- [ ] Chỉ giữ Elasticsearch / MinIO / Mailhog / AI service trong roadmap gần nếu có integration thật trong codebase
- [ ] Tách dần các phần backend/common chưa hợp lý khi Jira domain lớn lên

### Frontend

- [ ] Hoàn thiện cấu trúc component/hook/store theo layer-based để scale tiếp không vỡ
- [ ] Cân nhắc bắt đầu dùng `packages/ui` chỉ khi thật sự có shared UI cross-module, không tạo sớm cho đẹp cấu trúc

---

## Backlog thực tế — Chưa làm ngay

### Chỉ mở khi Jira đã ổn định

- [ ] Auth nâng cao: social login, MFA/TOTP, session UI
- [ ] Upload/file attachments
- [ ] Search thực sự dùng được
- [ ] Notification preferences / email notifications
- [ ] Production hardening sâu hơn (backup, Sentry, metrics, tracing)

### V2 / Để sau

- [ ] Slack module: team chat real-time
- [ ] Notion module: docs + block editor
- [ ] AI integration quy mô lớn / separate AI platform
- [ ] Billing / multi-tenant nâng cao / custom domain
- [ ] Kafka / ClickHouse / Kubernetes / advanced infra khác

---

## Ghi chú roadmap

- SuperBoard hiện tại đang ở trạng thái **Jira-first** chứ chưa phải multi-product platform.
- Hướng thực tế nhất cho giai đoạn này là: **ship Jira thật tốt → deploy thật → lấy trải nghiệm thực tế → rồi mới mở module mới**.
- Mọi roadmap vượt quá nhu cầu hiện tại nên xem là **tầm nhìn dài hạn**, không phải cam kết triển khai ngắn hạn.
