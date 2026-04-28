# SuperBoard — Manual E2E Test Guide (Full Flow)

Tài liệu này là checklist để bạn **tự trải nghiệm** và **test full luồng hiện có** trên web app.
Mục tiêu: chạy được hệ thống, đi qua các route chính, xác thực các thao tác CRUD cốt lõi, và thử các tình huống lỗi/edge-case.

---

## 0) Chuẩn bị (1 lần / mỗi máy)

- [ ] Node.js `>= 20.11.0`
- [ ] Docker Desktop (hoặc Docker Engine)
- [ ] Cài dependency: `npm i`

---

## 1) Khởi động hệ thống

### Cách khuyến nghị (all-in-one)

- [ ] Chạy: `npm run dev:start`
- [ ] Xác nhận services:
  - [ ] API: `http://localhost:4000`
  - [ ] Web: `http://localhost:3000`

---

## 1.1) Seed data / Credential để test

Seed sẽ tạo sẵn 1 workspace + nhiều project/task/chat/docs để bạn test ngay.

### Lệnh seed (khuyến nghị)

- Reset DB + migrate + seed: `npm --workspace @superboard/api run db:fresh`
- Chỉ seed (nếu DB đã migrate): `npm run db:seed`

### Credential đăng nhập (seed)

- Email: `nguyen.minh.tuan@techviet.local`
- Password: `Passw0rd!`

Ngoài ra seed còn tạo thêm nhiều user (đều dùng chung password `Passw0rd!`).

### Thông số môi trường cần có (local)

Mặc định API dùng file `apps/api/.env.local` (hoặc fallback `apps/api/.env.example`).

- `DATABASE_URL=postgresql://dev:devpassword@localhost:5433/superboard`
- `JWT_SECRET=superboard-local-jwt-secret-change-me`
- `FRONTEND_URL=http://localhost:3000`
- `PORT=4000`

### Tăng lượng dữ liệu seed (tuỳ chọn)

Seed support biến môi trường:

- `SEED_SCALE` (mặc định `3`) → tăng số lượng users/projects/tasks/comments/messages/docs
- Ví dụ: `SEED_SCALE=5 npm run db:seed`

### Health-check

- [ ] Chạy: `npm run health:check` (nếu chưa chạy trong `dev:start`)
- [ ] Mở web `http://localhost:3000` và đảm bảo không gặp trang lỗi global.

---

## 2) Smoke test (5 phút)

- [ ] Vào `http://localhost:3000` → redirect sang `/login`
- [ ] Thử truy cập thẳng route private (ví dụ `/jira`) khi chưa đăng nhập:
  - [ ] Thấy thông báo “Phiên hết hạn / Vui lòng đăng nhập lại”
  - [ ] Bấm “Quay lại đăng nhập” → về `/login`
- [ ] Đăng nhập thành công → auto điều hướng về `/jira` (hoặc `redirect` nếu có)
- [ ] Refresh trang ở `/jira`:
  - [ ] Vẫn giữ session (không bị đá về `/login`)

Ghi chú: nếu chưa có user/credential để login, chạy seed/reset DB:

- [ ] `npm run db:fresh` (hoặc `npm run db:seed` tùy môi trường)

---

## 3) Auth / Session

### Troubleshooting: `POST /api/v1/auth/login` trả về `404 Cannot POST /api/v1/auth/login`

Nếu API log ra `Cannot POST /api/v1/auth/login` thì nghĩa là backend **không thấy route** (không phải sai email/password).

- [ ] Bật debug routes rồi restart API:
  - [ ] `ENABLE_DEBUG_ROUTES=true npm --workspace @superboard/api run dev`
- [ ] Kiểm tra route có được register không:
  - [ ] `curl -s \"http://localhost:4000/api/v1/_debug/routes?q=auth\" | jq`
  - [ ] Bạn phải thấy `POST /api/v1/auth/login` trong danh sách.

### Login form validation

- [ ] Email trống → báo lỗi bắt buộc
- [ ] Email sai format → báo “Email không hợp lệ”
- [ ] Password trống → báo lỗi bắt buộc
- [ ] Password sai → hiển thị lỗi từ API (toast/inline)

### Session expiry / invalid token

- [ ] Đăng nhập xong, xóa access token trong localStorage (DevTools) rồi refresh:
  - [ ] Bị đưa về trạng thái “Phiên hết hạn”
  - [ ] Bấm quay lại `/login` được

---

## 4) Jira / Projects (Route: `/jira`)

### Load & error states

- [ ] Lần đầu vào `/jira`:
  - [ ] Khi loading thấy skeleton
  - [ ] Nếu API lỗi thấy UI error + nút retry hoạt động

### Search / sort / favorites

- [ ] Search theo tên/description dự án
- [ ] Sort:
  - [ ] `LATENCY: DESC`
  - [ ] `LATENCY: ASC`
  - [ ] `NODE: A-Z`
  - [ ] `NODE: Z-A`
- [ ] Toggle “Prioritized (favorites)”:
  - [ ] Có thể favorite/unfavorite dự án
  - [ ] Bật “Prioritized” chỉ hiển thị favorites

### Create project

- [ ] Bấm “Initialize Node” mở form tạo
- [ ] Tạo project tối thiểu (name, …) → tạo thành công và xuất hiện trong grid
- [ ] Reload trang → project vẫn còn

### Edit project

- [ ] Mở edit một project → update name/description/icon/color
- [ ] Lưu thành công → UI cập nhật đúng

### Archive/restore (nếu UI có)

- [ ] Archive một project:
  - [ ] Không còn xuất hiện trong danh sách active (hoặc có label archived tùy UX)
- [ ] Restore project (nếu có luồng restore trong UI)

---

## 5) Project detail (Routes dưới `/jira/projects/:projectId`)

Vào 1 project bằng cách click card trên `/jira`.

### Project main (Route: `/jira/projects/:projectId`)

- [ ] Mặc định load được view chính
- [ ] Thử đổi “view mode” (board/list/… nếu có) và refresh:
  - [ ] Hệ thống nhớ view/query (localStorage) và mở đúng trạng thái lần sau
- [ ] Test “Reset Context” ở trang `/jira`:
  - [ ] Reset xong, mở project quay về default

### Reports (Route: `/jira/projects/:projectId/reports`)

- [ ] Mở được trang reports
- [ ] Nếu có export/report actions:
  - [ ] Trigger action thành công
  - [ ] Khi API lỗi có thông báo rõ ràng

### Automation (Route: `/jira/projects/:projectId/automation`)

- [ ] Mở được trang automation của project
- [ ] Nếu có “proposal/approve/heal”:
  - [ ] Thử chạy ở trạng thái bình thường
  - [ ] Thử lỗi (tắt API / network) → UI fail gracefully

### Workflow settings (Route: `/jira/projects/:projectId/settings/workflow`)

- [ ] Mở được workflow settings theo project
- [ ] Thử sync template / update transitions (nếu có nút)

---

## 6) Chat (Routes: `/chat`, `/chat/:channelId`)

### Chat home (Route: `/chat`)

- [ ] Load danh sách channels
- [ ] Create channel (nếu UI có) → channel xuất hiện
- [ ] Join channel (nếu có) → vào được channel

### Channel (Route: `/chat/:channelId`)

- [ ] Load message list
- [ ] Send message:
  - [ ] Message hiển thị ngay
  - [ ] Refresh → message vẫn còn
- [ ] Thread/reply (nếu có UI)

---

## 7) Docs (Routes: `/docs`, `/docs/:docId`, `/docs/:docId/versions`, `/docs/atlas`, `/docs/divergence`)

### Docs home (Route: `/docs`)

- [ ] Bấm “Tạo Trang mới” → tạo doc và redirect sang `/docs/:docId`
- [ ] Khi API lỗi → có toast lỗi rõ ràng

### Doc detail (Route: `/docs/:docId`)

- [ ] Load nội dung doc
- [ ] Update title/content (nếu editor cho phép)
- [ ] Refresh vẫn giữ nội dung

### Versions (Route: `/docs/:docId/versions`)

- [ ] Xem được danh sách versions (nếu có)
- [ ] Restore/open version (nếu có)

### Atlas (Route: `/docs/atlas`)

- [ ] Load được trang Atlas
- [ ] Trigger phân tích/visualize (nếu có) → UI không crash

### Divergence (Route: `/docs/divergence`)

- [ ] Load được trang Divergence Audit
- [ ] Trigger audit → có kết quả hoặc state loading/error hợp lý

---

## 8) Dashboard (Route: `/dashboard`)

- [ ] Vào `/dashboard`:
  - [ ] Loading state: skeleton
  - [ ] Error state: FullPageError + nút reload hoạt động
- [ ] Kiểm tra các module hiển thị theo “adaptive layout”:
  - [ ] Không crash khi layout API trả về dữ liệu lạ/thiếu (nếu có thể mô phỏng)

---

## 9) Settings (Route: `/settings`)

### Profile

- [ ] Update full name:
  - [ ] Lưu thành công và giữ sau refresh
- [ ] Upload avatar (nếu enabled):
  - [ ] Upload hợp lệ → avatar cập nhật
  - [ ] Upload file sai type/size → có báo lỗi

### Workspace

- [ ] Open “Create workspace” modal → tạo workspace (nếu backend hỗ trợ)
- [ ] Xem danh sách members và role
- [ ] Thử thay role (chỉ owner/admin) → cập nhật thành công
- [ ] Thử remove member (nếu có)

### Notifications

- [ ] Toggle notification preferences:
  - [ ] `taskAssignedEmail`
  - [ ] `workspaceInviteEmail`
- [ ] Refresh vẫn giữ trạng thái

### Workflows

- [ ] Mở tab Workflows:
  - [ ] Tạo status mới
  - [ ] Update status
  - [ ] Delete status (có confirm nếu UX có)
  - [ ] Update transitions
  - [ ] Sync workflow template

---

## 10) Automation (Route: `/automation/symbiosis`)

- [ ] Mở được trang symbiosis
- [ ] Thử các action liên quan automation (pulse/health/heal/agent logs) nếu UI có

---

## 11) Global UX / Regression checklist

### Điều hướng & reload

- [ ] Điều hướng giữa các tab sidebar (Dự án/Chat/Tài liệu/Dashboard/Cài đặt) không lỗi
- [ ] Back/forward browser hoạt động đúng
- [ ] Hard refresh ở mọi route private không bị văng session

### Loading & error handling

- [ ] Ở mỗi trang, khi tắt API (stop server) → UI có state lỗi rõ ràng, không infinite spinner
- [ ] Không có lỗi nghiêm trọng trong Console (red errors) khi thao tác bình thường

### Responsive & accessibility (quick pass)

- [ ] Desktop 1440px, laptop 1280px, tablet 768px, mobile 390px:
  - [ ] Layout không vỡ, không overflow ngang bất thường
- [ ] Tab navigation trong form:
  - [ ] Focus ring / focus state nhìn thấy được
- [ ] Labels/aria:
  - [ ] Input quan trọng có label/aria-label hợp lý

### Data integrity

- [ ] CRUD tạo/sửa/xóa (archive) không tạo dữ liệu “rác” (refresh kiểm tra lại)
- [ ] Các mutation thành công đều invalidated/refetch hợp lý (UI không stale)

---

## 12) Ghi lại kết quả test

Gợi ý format ghi bug để debug nhanh:

- Route: `/...`
- Steps to reproduce:
  1. …
  2. …
- Expected vs Actual:
- Console errors (copy stack):
- Network request (endpoint + status code):
- Screenshot/recording:
- Environment:
  - OS:
  - Browser:
  - Commit/branch:
