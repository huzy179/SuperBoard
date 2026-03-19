---
phase: 01
slug: workflow-lifecycle-baseline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                  |
| ---------------------- | ---------------------- |
| **Framework**          | none — Wave 0 installs |
| **Config file**        | none — Wave 0 installs |
| **Quick run command**  | `npm run test`         |
| **Full suite command** | `npm run test`         |
| **Estimated runtime**  | ~20 seconds            |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type           | Automated Command | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ------------------- | ----------------- | ----------- | ---------- |
| 01-01-01 | 01   | 0    | WFLO-01     | integration         | `npm run test`    | ❌ W0       | ⬜ pending |
| 01-01-02 | 01   | 1    | WFLO-01     | integration         | `npm run test`    | ❌ W0       | ⬜ pending |
| 01-02-01 | 02   | 1    | WFLO-02     | integration         | `npm run test`    | ❌ W0       | ⬜ pending |
| 01-02-02 | 02   | 2    | WFLO-02     | e2e/manual-assisted | `npm run test`    | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `apps/api/test/workflow-lifecycle-baseline.spec.ts` — stubs for WFLO-01
- [ ] `apps/web/test/workflow-status-consistency.spec.ts` — stubs for WFLO-02
- [ ] `apps/api/package.json` + `apps/web/package.json` — add runnable `test` scripts
- [ ] Test runner install/config (Vitest or Jest) — if no framework detected

---

## Manual-Only Verifications

| Behavior                                                          | Requirement | Why Manual                                                  | Test Instructions                                                                                         |
| ----------------------------------------------------------------- | ----------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Status transition UX phản ánh nhất quán sau refresh và chuyển màn | WFLO-02     | Cần xác nhận trải nghiệm UI thực tế giữa nhiều màn hình     | 1) Đổi status task ở board 2) Chuyển sang list/detail 3) Refresh browser 4) Xác nhận trạng thái đồng nhất |
| Archive/restore hành vi theo role và parent relation              | WFLO-01     | Cần xác nhận policy + edge flow liên quan role và hierarchy | 1) Archive project/task 2) Thử restore khi parent archived 3) Xác nhận thông báo và guard hành vi         |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
