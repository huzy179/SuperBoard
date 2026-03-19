# Requirements: SuperBoard Super App

**Defined:** 2026-03-19
**Core Value:** Giúp team dev vận hành workflow task/project chắc chắn mỗi ngày, đồng thời tận dụng AI để tăng tốc thực thi và mở rộng kỹ năng thực chiến.

## v1 Requirements

### Workflow Core

- [ ] **WFLO-01**: User có thể quản lý lifecycle đầy đủ cho workspace/project/task qua API và UI nhất quán (create/read/update/archive).
- [ ] **WFLO-02**: User có thể cấu hình và sử dụng custom statuses theo project/workspace mà không phá vỡ tính nhất quán trạng thái task.
- [ ] **WFLO-03**: User có thể khai báo dependency, blocker, sub-task và hệ thống phản ánh đúng quan hệ này trong cả API lẫn UI.
- [ ] **WFLO-04**: User có thể triage backlog theo cơ chế manual-first với filter/sort và gợi ý dedupe cơ bản để giảm task trùng lặp.

### AI Task Assistance

- [ ] **AITS-01**: User có thể nhập mô tả tự nhiên và nhận `TaskDraft` có cấu trúc (title, description, acceptance criteria, priority).
- [ ] **AITS-02**: User có thể review/edit/reject/accept AI draft trước khi bất kỳ task nào được tạo chính thức.
- [ ] **AITS-03**: AI suggestion phải được grounding mức cơ bản bằng context từ workspace/project/task hiện có.
- [ ] **AITS-04**: User có thể dùng AI-assisted triage nâng cao để nhận gợi ý nhãn và gợi ý project phù hợp cho task.
- [ ] **AITS-05**: Team có thể tạo auto-summaries (standup/weekly/project pulse) từ dữ liệu task timeline.

### Integrations

- [ ] **INTG-01**: System có integration boundary ổn định để đồng bộ workflow với GitHub/Slack/Calendar theo hướng idempotent và có retry-safe behavior.

### Governance & Observability

- [ ] **GOV-01**: Mọi AI action có ghi nhận audit tối thiểu (ai gọi gì, input class, output class, ai/user nào duyệt, thời điểm).
- [ ] **GOV-02**: System có policy tối thiểu theo role/workspace để giới hạn hành vi AI theo phạm vi được phép.

## v2 Requirements

### Skill Intelligence

- **SKIL-01**: System xây được skill graph dựa trên tín hiệu thực thi task thực tế của thành viên/team.
- **SKIL-02**: System đưa ra assignment recommendation có giải thích vì sao và nêu phương án thay thế.
- **SKIL-03**: System hỗ trợ skill-aware task decomposition theo năng lực hiện tại và mục tiêu phát triển.

### Advanced AI Automation

- **AUTO-01**: Bật bounded autonomy theo risk tier với rollback/kill-switch rõ ràng.
- **AUTO-02**: Closed-loop learning dùng feedback delivery outcomes để cải thiện chất lượng AI generation.

## Out of Scope

| Feature                                                   | Reason                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------- |
| Keycloak integration in v1                                | Chưa cần ở giai đoạn dựng base MVP; tăng độ phức tạp auth quá sớm |
| Production deployment hoàn chỉnh trong v1                 | Ưu tiên ổn định kiến trúc và nghiệp vụ cốt lõi trước              |
| CI/CD hoàn chỉnh trong v1                                 | Tạm hoãn để tập trung năng lực product foundation                 |
| Fully autonomous task creation/assignment không cần duyệt | Rủi ro backlog noise và giảm trust giai đoạn đầu                  |
| Generic chatbot-everywhere thiếu context grounding        | Giá trị thấp cho workflow, tăng nguy cơ trả lời chung chung       |

## Traceability

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| WFLO-01     | Phase 1 | Pending |
| WFLO-02     | Phase 1 | Pending |
| WFLO-03     | Phase 2 | Pending |
| WFLO-04     | Phase 2 | Pending |
| AITS-01     | Phase 3 | Pending |
| AITS-02     | Phase 3 | Pending |
| AITS-03     | Phase 4 | Pending |
| AITS-04     | Phase 5 | Pending |
| AITS-05     | Phase 5 | Pending |
| INTG-01     | Phase 6 | Pending |
| GOV-01      | Phase 4 | Pending |
| GOV-02      | Phase 4 | Pending |

**Coverage:**

- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✅

---

_Requirements defined: 2026-03-19_
_Last updated: 2026-03-19 after initial definition_
