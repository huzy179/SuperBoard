# SuperBoard Super App (AI-Enhanced Task & Skill Platform)

## What This Is

SuperBoard là một super app dành cho team phát triển phần mềm, tập trung vào quản lý công việc theo dự án/workspace và tăng năng lực team bằng AI. Sản phẩm kết hợp nền tảng quản lý task ổn định với lớp AI hỗ trợ tạo task, tổ chức công việc, và gợi ý học kỹ năng phù hợp với ngữ cảnh làm việc. Giai đoạn hiện tại ưu tiên dựng nền tảng MVP thật vững để tăng tốc cho các vòng phát triển tiếp theo.

## Core Value

Giúp team dev vận hành workflow task/project chắc chắn mỗi ngày, đồng thời tận dụng AI để tăng tốc thực thi và mở rộng kỹ năng thực chiến.

## Requirements

### Validated

- ✓ Người dùng có thể đăng nhập phiên làm việc bằng auth nội bộ (JWT/session flow qua API) — existing
- ✓ Người dùng có thể quản lý workspace/project/task cơ bản trên kiến trúc web + API hiện hữu — existing
- ✓ Hệ thống đã có monorepo đa ứng dụng (web/api/ai-service/shared) đủ nền tảng để mở rộng MVP theo phase — existing

### Active

- [ ] Củng cố foundation MVP: chuẩn hóa domain workspace/project/task, API contract, error handling, và guard flow để ổn định trước khi scale tính năng
- [ ] Thiết kế luồng AI tạo task từ mô tả công việc của dev team (input rõ ràng, output có cấu trúc, dễ chỉnh sửa)
- [ ] Xây nền tảng tri thức kỹ năng: AI hỗ trợ giải thích/gợi ý kỹ năng liên quan trực tiếp tới task đang làm
- [ ] Hoàn thiện trải nghiệm app riêng cho team dev (private routes, navigation, service boundaries, data contracts)
- [ ] Đảm bảo codebase sẵn sàng bước vào MVP delivery theo phase (testability, maintainability, tích hợp service rõ ràng)

### Out of Scope

- Keycloak integration — chưa làm trong v1 để tránh mở rộng auth surface quá sớm
- Production deployment pipeline — chưa làm trong v1 để ưu tiên hoàn thiện product foundation
- CI/CD hoàn chỉnh — tạm hoãn đến sau khi kiến trúc và luồng nghiệp vụ MVP ổn định

## Context

Codebase hiện là monorepo Turborepo gồm `apps/web` (Next.js App Router), `apps/api` (NestJS + Prisma), `apps/ai-service` (FastAPI + service modules), và `packages/shared` cho DTO/types dùng chung. Kiến trúc backend đã theo module domain (`auth`, `project`, `task`, `workspace`) và frontend đã có phân tách route public/private cùng service layer gọi API.

Hướng sản phẩm hiện tại là brownfield: giữ lại năng lực đã có, chuẩn hóa nền tảng, rồi mới tăng dần chiều sâu AI vào task lifecycle và skill enablement cho team dev.

## Constraints

- **Tech stack**: Giữ Next.js + NestJS + Prisma + Python AI service hiện có — giảm rủi ro chuyển stack khi chưa vào MVP ổn định
- **Scope v1**: Ưu tiên “base thật xịn” trước tính năng mở rộng — đảm bảo nền tảng vận hành chắc cho các phase sau
- **Auth boundary**: Chưa triển khai Keycloak ở v1 — tránh tăng độ phức tạp tích hợp identity ngoài lõi sản phẩm
- **Delivery boundary**: Chưa triển khai production deploy/CI-CD đầy đủ ở v1 — tập trung chất lượng kiến trúc và luồng nghiệp vụ trước
- **Primary users**: Team phát triển phần mềm — yêu cầu UX và data model bám sát workflow kỹ thuật thực tế

## Key Decisions

| Decision                                                | Rationale                                                             | Outcome   |
| ------------------------------------------------------- | --------------------------------------------------------------------- | --------- |
| Ưu tiên workflow task/project chắc trước, AI bổ trợ sau | Giảm rủi ro sản phẩm, tạo nền sử dụng hằng ngày rồi mới tăng AI depth | — Pending |
| Định vị sản phẩm là super app cho team dev              | Tập trung persona và domain cụ thể để giảm scope trôi                 | — Pending |
| Chốt v1 không làm Keycloak                              | Tránh phân tán effort vào auth enterprise khi nền tảng chưa ổn định   | — Pending |
| Chốt v1 chưa làm deploy/CI-CD hoàn chỉnh                | Ưu tiên ổn định kiến trúc và nghiệp vụ MVP                            | — Pending |

---

_Last updated: 2026-03-19 after initialization_
