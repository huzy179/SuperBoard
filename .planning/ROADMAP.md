# Roadmap: SuperBoard

## Overview

Roadmap này chuyển SuperBoard từ workflow core ổn định sang AI augmentation có kiểm soát: trước hết hoàn thiện khả năng vận hành workspace/project/task end-to-end, sau đó thêm AI draft và grounding theo cơ chế human-in-the-loop, rồi mở rộng sang triage/summaries và integration boundary retry-safe cho hệ sinh thái ngoài.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Workflow Lifecycle Baseline** - Hoàn thiện lifecycle workspace/project/task nhất quán giữa API và UI.
- [ ] **Phase 2: Workflow Relationships & Backlog Triage** - Bổ sung cấu trúc quan hệ công việc và triage backlog manual-first.
- [ ] **Phase 3: AI Draft Generation with Human Review** - Tạo TaskDraft có cấu trúc và bắt buộc duyệt trước khi tạo task chính thức.
- [ ] **Phase 4: Grounded AI Governance** - Đảm bảo AI grounding theo context và enforce policy/audit theo workspace role.
- [ ] **Phase 5: AI Triage & Operational Summaries** - Tăng tốc vận hành với triage nâng cao và summary tự động theo timeline.
- [ ] **Phase 6: External Integration Boundary** - Thiết lập biên tích hợp GitHub/Slack/Calendar an toàn idempotent, retry-safe.

## Phase Details

### Phase 1: Workflow Lifecycle Baseline

**Goal**: Users có thể quản lý workspace/project/task lifecycle đầy đủ và ổn định trong cùng một mô hình trạng thái chuẩn.
**Depends on**: Nothing (first phase)
**Requirements**: WFLO-01, WFLO-02
**Success Criteria** (what must be TRUE):

1. User có thể create/read/update/archive workspace, project và task qua UI mà dữ liệu phản ánh đúng qua API.
2. User có thể định nghĩa custom statuses theo project/workspace và sử dụng xuyên suốt mà không tạo trạng thái mâu thuẫn.
3. User nhìn thấy cùng một trạng thái task giữa các màn hình và khi refresh session.
   **Plans**: 3 plans

Plans:

- [ ] 01-01-PLAN.md — Backend lifecycle baseline cho workspace/project/task với soft-delete + restore invariants.
- [ ] 01-02-PLAN.md — Status model custom (workspace template + project override) và strict transition backend policy.
- [ ] 01-03-PLAN.md — UI lifecycle controls + optimistic consistency/rollback/retry cho board/list.

### Phase 2: Workflow Relationships & Backlog Triage

**Goal**: Users có thể mô hình hóa quan hệ task và triage backlog hiệu quả theo cách manual-first.
**Depends on**: Phase 1
**Requirements**: WFLO-03, WFLO-04
**Success Criteria** (what must be TRUE):

1. User có thể thiết lập dependency, blocker và sub-task; UI/API phản ánh đúng quan hệ này ở cả chiều đọc và cập nhật.
2. User có thể filter/sort backlog để triage thủ công theo trạng thái, ưu tiên hoặc phạm vi project/workspace.
3. User nhận được gợi ý dedupe cơ bản khi tạo hoặc rà soát task để giảm trùng lặp.
   **Plans**: TBD

Plans:

- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: AI Draft Generation with Human Review

**Goal**: Users nhận được draft task từ mô tả tự nhiên và giữ toàn quyền duyệt trước khi ghi vào backlog.
**Depends on**: Phase 2
**Requirements**: AITS-01, AITS-02
**Success Criteria** (what must be TRUE):

1. User nhập mô tả tự nhiên và nhận `TaskDraft` có đủ title, description, acceptance criteria, priority.
2. User có thể edit, reject hoặc accept draft trước khi bất kỳ task chính thức nào được tạo.
3. Không có task nào được tạo tự động nếu chưa có hành động accept từ user.
   **Plans**: TBD

Plans:

- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Grounded AI Governance

**Goal**: AI suggestion phải bám context hợp lệ và luôn nằm trong ranh giới policy/audit kiểm soát được.
**Depends on**: Phase 3
**Requirements**: AITS-03, GOV-01, GOV-02
**Success Criteria** (what must be TRUE):

1. AI suggestion cho task thể hiện được grounding cơ bản từ context workspace/project/task mà user có quyền truy cập.
2. Mỗi AI action đều có bản ghi audit tối thiểu gồm loại action, lớp input/output, actor duyệt và thời điểm.
3. User theo role/workspace chỉ thực hiện được các hành vi AI nằm trong policy được cấp.
4. Khi AI action vi phạm policy, hệ thống chặn hành động và trả về phản hồi nhất quán.
   **Plans**: TBD

Plans:

- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: AI Triage & Operational Summaries

**Goal**: Users có thể tận dụng AI để phân loại backlog tốt hơn và theo dõi tiến độ team bằng bản tóm tắt tự động.
**Depends on**: Phase 4
**Requirements**: AITS-04, AITS-05
**Success Criteria** (what must be TRUE):

1. User nhận gợi ý nhãn và gợi ý project phù hợp cho task trong luồng triage nâng cao.
2. User có thể tạo standup summary hoặc weekly/project pulse summary từ task timeline hiện có.
3. Summary đầu ra có cấu trúc rõ ràng để team dùng ngay trong cập nhật tiến độ.
   **Plans**: TBD

Plans:

- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: External Integration Boundary

**Goal**: System đồng bộ workflow với hệ ngoài qua một boundary ổn định, idempotent và retry-safe.
**Depends on**: Phase 5
**Requirements**: INTG-01
**Success Criteria** (what must be TRUE):

1. Đồng bộ workflow với GitHub/Slack/Calendar không tạo side effects lặp khi gửi lại cùng event.
2. Khi có lỗi tạm thời, cơ chế retry xử lý lại an toàn mà không tạo bản ghi trùng.
3. User quan sát được trạng thái đồng bộ thành công/thất bại để theo dõi xử lý vận hành.
   **Plans**: TBD

Plans:

- [ ] 06-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase                                      | Plans Complete | Status      | Completed |
| ------------------------------------------ | -------------- | ----------- | --------- |
| 1. Workflow Lifecycle Baseline             | 0/3            | Not started | -         |
| 2. Workflow Relationships & Backlog Triage | 0/2            | Not started | -         |
| 3. AI Draft Generation with Human Review   | 0/2            | Not started | -         |
| 4. Grounded AI Governance                  | 0/2            | Not started | -         |
| 5. AI Triage & Operational Summaries       | 0/2            | Not started | -         |
| 6. External Integration Boundary           | 0/1            | Not started | -         |
