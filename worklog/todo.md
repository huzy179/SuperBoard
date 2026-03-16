# TODO

## Ưu tiên cao (P0)

- [ ] Tạo migration đầu tiên trong `apps/api/prisma/migrations` để CD dùng `prisma migrate deploy` chuẩn production.
- [ ] Chuẩn hóa import runtime từ `@superboard/shared` trong tất cả app (không import trực tiếp từ package con).
- [ ] Rà soát `.env.example` giữa root/web/api/ai-service để đồng bộ key bắt buộc.

## Ưu tiên trung bình (P1)

- [ ] Hoàn thiện bước deploy thật trong `.github/workflows/cd.yml` (thay `echo TODO`).
- [ ] Bổ sung health check cho AI service theo chuẩn response giống API.
- [ ] Viết tài liệu ngắn cho quy trình local: `db:reset`, `db:seed`, `dev:infra`, `dev`.

## Backlog

- [ ] Bổ sung test integration cho `/api/v1/health`.
- [ ] Dọn warning bảo mật từ `npm audit`.
