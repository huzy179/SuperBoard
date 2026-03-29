# Smoke Test Checklist — Jira MVP Core Flow

> Manual testing checklist cho E2E flow cốt lõi. Chạy trước mỗi sprint release.

**Test Environment:** `http://localhost:3000`  
**Credentials:** `nguyen.minh.tuan@techviet.local` / `Passw0rd!`  
**Database:** PostgreSQL (localhost:5433)  
**Seed Data:** 4 projects, 20+ tasks, 6 users

---

## 1. **LOGIN FLOW** ✅

### Basic Login

- [ ] Navigate to `/login`
- [ ] Page shows email + password inputs (no auto-redirect if logged out)
- [ ] Enter valid credentials: `nguyen.minh.tuan@techviet.local` / `Passw0rd!`
- [ ] Click "Đăng nhập" button
- [ ] Redirects to `/jira` (Jira Home)
- [ ] No console errors

### Invalid Credentials

- [ ] Try wrong email — shows "Đăng nhập thất bại"
- [ ] Try wrong password — shows "Đăng nhập thất bại"
- [ ] Try empty fields — shows validation error
- [ ] No leaked information (generic error message for security)

### Session Persistence

- [ ] After login, refresh page — stays logged in (not redirected to login)
- [ ] Token stored in localStorage (check DevTools → Application → LocalStorage)

---

## 2. **JIRA HOME / DASHBOARD** ✅

### Page Load

- [ ] Jira Home loads at `/jira`
- [ ] Shows list of projects from seed data (4 default projects)
- [ ] No 404 or blank page
- [ ] No console errors

### Empty State (if projects deleted)

- [ ] If no projects exist, shows "Chưa có dự án nào" empty state
- [ ] Empty state has "Tạo dự án" CTA button
- [ ] Button clicking goes to create project panel

### UI Elements Present

- [ ] "+ Tạo dự án" button in header
- [ ] Search bar for projects (by name/key/description)
- [ ] Sort options: "Mới cập nhật trước", "Cập nhật cũ trước", "Tên A-Z", "Tên Z-A"
- [ ] Filter: "Dự án ghim" toggle for favorites
- [ ] "Reset ngữ cảnh" button clears saved filters/sorts

### Loading State

- [ ] While projects list loads, show skeleton/spinner
- [ ] Skeleton disappears when data arrives
- [ ] No hanging loaders

### Error State

- [ ] If API fails (mock 500 error), shows "Không thể tải danh sách dự án"
- [ ] Error state has retry button
- [ ] Retry re-fetches data

### Project Cards

- [ ] Each project shows: icon, name, key, description
- [ ] Clicking project card navigates to `/jira/projects/{projectId}`
- [ ] Star icon toggles project as favorite

---

## 3. **CREATE PROJECT** ✅

### Form Display

- [ ] Click "+ Tạo dự án" button
- [ ] Form panel opens below header
- [ ] Form fields visible: Tên dự án, Icon, Màu, Mô tả

### Form Validation

- [ ] Leave "Tên dự án" empty, try submit — shows "required" error
- [ ] Enter project name "Test Project"
- [ ] Default icon: 📌 (shows)
- [ ] Default color: #2563eb (blue, shows in color swatch)

### Form Submission

- [ ] Fill: Tên dự án = "Test Project", Mô tả = "Testing checklist"
- [ ] Click "Tạo" button
- [ ] Form closes
- [ ] New project appears in projects list
- [ ] No console errors

### Post-Creation

- [ ] After creation, list refreshes (no manual refresh needed)
- [ ] New project appears with correct name/icon/color/description

---

## 4. **PROJECT DETAIL** ✅

### Navigation

- [ ] Click on a project card from home
- [ ] Navigates to `/jira/projects/{projectId}`
- [ ] Loads project details (name, description, task list)

### View Modes

- [ ] **Board** (Kanban): Shows 5 status columns (Cần làm, Đang làm, Đang review, Hoàn thành, Đã huỷ)
- [ ] **List**: Shows tasks in table format with search/sort/filter
- [ ] **Calendar**: Shows month view with tasks by due date
- [ ] View mode buttons in top-right (Board / List / Calendar icons)
- [ ] Switching between views works, state persists in localStorage

### Empty State

- [x] If project has no tasks, shows empty state card "Project chưa có task" (dashed card + hướng dẫn bấm "Tạo task")
- [ ] Empty state is shown consistently across Board/List/Calendar until the project has at least 1 task

### Task Loading

- [ ] Tasks load without error
- [ ] No lingering spinners after load complete

---

## 5. **CREATE TASK** ✅

### Form Display

- [ ] "+ Tạo task" button in top toolbar
- [ ] Click to show create task form
- [ ] Form fields: Tiêu đề (required), Trạng thái, Độ ưu tiên, Loại, Ngày hết hạn, Người thực hiện, Mô tả

### Validation

- [ ] Leave "Tiêu đề" empty, submit — shows error
- [ ] Fill "Tiêu đề" = "New test task"
- [ ] Status defaults to "Cần làm" (todo)
- [ ] Click "Tạo" button

### Post-Creation

- [ ] New task appears in board/list view
- [ ] Task appears in correct status column (default: "Cần làm")
- [ ] Form resets and closes
- [ ] No console errors

### Optional Fields

- [ ] Fill all optional fields: priority, type, due date, assignee, description
- [ ] Task shows with all details in detail panel

---

## 6. **TASK DRAG-DROP** ✅

### Board Drag Flow

- [ ] Switch to Board view
- [ ] Click + drag task from "Cần làm" (todo) column
- [ ] Drag over "Đang làm" (in_progress) column — visual feedback (hover effect)
- [ ] Drop task — task moves to "Đang làm" column
- [ ] API call: `PATCH /api/v1/projects/{id}/tasks/{taskId}/status` succeeds
- [ ] Task stays in new position (no rollback)

### Multiple Drag in Sequence

- [ ] Drag task from "Đang làm" → "Đang review"
- [ ] Drag another task "Cần làm" → "Hoàn thành"
- [ ] All positions persist correctly

### Mobile (if testing on small screen)

- [ ] Drag-drop still works on desktop
- [ ] **NOTE:** HTML5 drag-drop doesn't work on mobile — expected limitation
- [ ] Mobile fallback: can change status via task detail panel edit instead

---

## 7. **TASK DETAIL PANEL** ✅

### Opening Panel

- [ ] Click on task card → opens detail panel
- [ ] Panel shows: title, description, status, priority, type, story points, due date, assignee

### Edit Fields

- [ ] Edit task title — shows input field, can change + save
- [ ] Edit description — shows textarea
- [ ] Change status dropdown — list of statuses visible
- [ ] Change priority, type, due date, assignee
- [ ] Click "Cập nhật" button
- [ ] Changes saved to API and reflected in board/list view

### Close Panel

- [ ] Click "X" or "ESC" key — panel closes
- [ ] Focus returns to page
- [ ] No unsaved data lost (if form was dirty, show warning — currently no warning, auto-save only)

### Subtasks

- [ ] See "Subtasks" section in panel
- [ ] Click "+ Thêm subtask", enter title
- [ ] New subtask appears in list
- [ ] Click checkbox on subtask → toggled to done
- [ ] Click delete icon on subtask → subtask removed
- [ ] No console errors

---

## 8. **TASK COMMENTS & HISTORY** ✅

### Comments Section

- [ ] Task detail panel shows "Bình luận" (Comments) tab
- [ ] List of existing comments loaded (if any)
- [ ] Each comment shows: author, time, text content

### Add Comment

- [ ] In comment input: type "Test comment"
- [ ] Click "Gửi" or press Enter
- [ ] Comment appears in list immediately (optimistic update)
- [ ] Comment persisted to API
- [ ] No console errors

### Edit Comment

- [ ] Hover over your own comment
- [ ] See edit/delete icons appear
- [ ] Click edit → text becomes editable
- [ ] Change text + submit → updates
- [ ] Updated comment reflects immediately

### Delete Comment

- [ ] Hover over your own comment
- [ ] Click delete icon → shows confirmation
- [ ] Confirm → comment removed from list + API
- [ ] No orphaned comment IDs in database

### History Tab

- [ ] Click "Lịch sử" tab
- [ ] Shows activity log: "Created task", "Status changed", "Comment added", etc.
- [ ] Activity shows timestamp + author
- [ ] No console errors

### Real-time Updates

- [ ] Open same task in multiple browser tabs
- [ ] In tab 1, add a comment
- [ ] In tab 2, comment appears within 2-3 seconds (via WebSocket or manual refresh)
- [ ] **Expected limitation:** May require manual refresh if WebSocket connection drops

---

## 9. **BULK OPERATIONS** ✅

### Select Tasks

- [ ] Multi-select checkbox in task list/board
- [ ] Click checkbox on multiple tasks
- [ ] Shows "Selected: N" counter + bulk actions toolbar

### Bulk Update Status

- [ ] Select 2+ tasks
- [ ] In bulk toolbar, change status to "Hoàn thành" (done)
- [ ] All selected tasks move to "Hoàn thành"
- [ ] No console errors

### Bulk Delete

- [ ] Select 2+ tasks
- [ ] Click "Delete" button in bulk toolbar
- [ ] Shows confirmation: "Xoá N tasks?"
- [ ] Confirm → tasks deleted + show "Undo" button with 30s countdown
- [ ] Click "Undo" → tasks restored
- [ ] After 30s, undo button disappears → deletion permanent

### Clear Selection

- [ ] After operations, deselect all or navigate away
- [ ] Bulk toolbar disappears
- [ ] No orphaned state

---

## 10. **RESPONSIVE DESIGN** ✅

### Desktop (1920x1080)

- [ ] All UI elements visible and properly aligned
- [ ] No overflow or clipping
- [ ] Sidebar/drawer consistent

### Tablet (768px width)

- [ ] Project cards stack 2-column layout (from grid-cols-3)
- [ ] Inputs full-width
- [ ] Buttons centered
- [ ] Forms readable

### Mobile (375px width)

- [ ] Single-column layout, stacked
- [ ] Touch-friendly button sizes (48px min)
- [ ] Form inputs full-width
- [ ] Modal dialogs scale down
- [ ] **NOTE:** Drag-drop not supported on touch (expected)

---

## 11. **ERROR HANDLING** ✅

### API Errors

- [x] Try accessing invalid project: `/jira/projects/invalid-id`
- [x] Shows full-page error: title "Không thể tải project" + action button "Quay lại danh sách"
- [x] No infinite loop or blank page

### Network Errors

- [ ] Stop dev API server (simulate network error)
- [ ] Try loading projects → shows "Không thể tải danh sách" + retry
- [ ] Restart API, click retry → projects load again
- [ ] No stuck loading spinner

### Session Expiry

- [ ] Clear localStorage manually (simulate token expiration)
- [ ] Refresh page at `/jira/projects/...`
- [ ] Auto-redirect to `/login`
- [ ] Can log in again

### Form Validation

- [ ] Try creating project without name → error message
- [ ] Try creating task without title → error message
- [ ] Error messages appear inline, not blocking
- [ ] Form can be corrected and resubmitted

---

## 12. **CONSOLE & PERFORMANCE** ✅

### Console Errors

- [ ] After each action, check DevTools console
- [ ] No `console.error()`, warning messages (except React warnings for known issues)
- [ ] No uncaught exceptions
- [ ] No 404 resource errors (for images, fonts, etc.)

### Network Requests

- [ ] Open DevTools → Network tab
- [ ] Check all API requests have status 200, 201, or expected code
- [ ] No pending requests stuck in "loading"
- [ ] No duplicate requests for same endpoint

### Performance

- [ ] Page transitions < 500ms
- [ ] No layout jank during interactions
- [ ] Scroll smooth on task list
- [ ] Animations (fade, slide) play smoothly

---

## 13. **AUTHENTICATION & SECURITY** ✅

### Token Storage

- [ ] After login, check localStorage for `accessToken`
- [ ] **Risk note:** localStorage is vulnerable to XSS — should use httpOnly cookies in production

### Unauthorized Access

- [ ] Try accessing `/jira` without valid token
- [ ] Auto-redirects to `/login`
- [ ] No data leaked

### Wrong User Access

- [ ] Log in as User A
- [ ] Try accessing project owned by User B (via URL)
- [ ] Should either: see 403, or see project in shared list if public
- [ ] Check backend permission logic

---

## 14. **NOTIFICATIONS** ✅

### Notification Icon

- [ ] Top-right header has notification bell icon
- [ ] Shows unread count badge (if notifications exist)

### Notification Center

- [ ] Click bell icon — opens notifications drawer
- [ ] Shows list of notifications (or "No notifications" if empty)
- [ ] Each notification has: title, timestamp, read/unread indicator

### Mark as Read

- [ ] Click notification → marks as read
- [ ] Badge count decreases
- [ ] Notification fades (optional visual feedback)

### Clear Notifications

- [ ] If implemented, clear all notifications
- [ ] Badge disappears
- [ ] List becomes empty

---

## 15. **LOGOUT** ✅

### User Menu

- [ ] Click user avatar/menu in top-right header
- [ ] Shows "Đăng xuất" option (or settings options)
- [ ] Click "Đăng xuất"
- [ ] Redirects to `/login`
- [ ] Token cleared from localStorage
- [ ] Can log in again

---

## **SUMMARY CHECKLIST**

- [ ] All 15 sections tested
- [ ] No critical blockers (app functional end-to-end)
- [ ] No console errors
- [ ] No broken links or 404s
- [ ] Forms validate + submit
- [ ] API calls succeed with 2xx/3xx codes
- [ ] Redirects work (login → home → project → back)
- [ ] Mobile responsive (at least 3 breakpoints tested)
- [ ] Comments, history, history work
- [ ] Drag-drop, bulk operations work
- [ ] Error states handled gracefully

---

## **Known Limitations (NOT bugs)**

- ⚠️ **No real-time board sync** — multiple users editing same project need manual refresh
- ⚠️ **Drag-drop mobile** — not supported on touch devices (fallback: edit status in task detail)
- ⚠️ **30s undo timer** — after timeout, delete is permanent
- ⚠️ **Plain text comments** — no markdown/rich text formatting
- ⚠️ **Token in localStorage** — XSS vulnerability in dev; should use httpOnly cookies in production

---

## **How to Run This Checklist**

1. Start dev environment: `make dev` (or `npm run dev --workspace @superboard/web` + API)
2. Open `http://localhost:3000` in browser
3. Go through each section sequentially
4. Check boxes as you complete each test
5. Log any issues found with screenshot + reproduction steps
6. If all pass → ready for release

---

## **Issue Reporting Template**

If you find a bug during testing:

```markdown
**Section:** [Which section number]
**Title:** [Brief description]
**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Expected vs Actual]

**Evidence:**

- Screenshot: [...]
- Console error: [...]
- Browser/OS: [...]
```

---

**Last Updated:** 2026-03-23  
**Tested By:** [Your name]  
**Status:** ✅ READY FOR TESTING
