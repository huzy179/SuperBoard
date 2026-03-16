# DOING

## Đang tập trung

- [ ] Chuẩn hóa migration strategy Prisma 7 cho môi trường production.

## Blockers hiện tại

- Chưa có file migration trong `apps/api/prisma/migrations`, nên đang fallback `prisma db push` cho local reset.

## Next actions ngay

1. Tạo migration `init` từ schema hiện tại.
2. Commit migration và kiểm tra lại `npm run db:reset` + `npm run db:seed`.
3. Xóa fallback không cần thiết trong script nếu đã ổn định.
