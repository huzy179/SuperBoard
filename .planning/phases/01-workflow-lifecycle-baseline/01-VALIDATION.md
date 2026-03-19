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

| Property               | Value                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Framework**          | none — Wave 0 installs                                                                                                                                                                                                                     |
| **Config file**        | none — Wave 0 installs                                                                                                                                                                                                                     |
| **Quick run command**  | `npm --workspace @superboard/api run test -- workflow-lifecycle.integration.test.ts -x`                                                                                                                                                    |
| **Full suite command** | `npm --workspace @superboard/api run test -- workflow-lifecycle.integration.test.ts && npm --workspace @superboard/api run test -- workflow-status-policy && npm --workspace @superboard/web run test -- jira-status-consistency.test.tsx` |
| **Estimated runtime**  | ~25-30 seconds                                                                                                                                                                                                                             |

---

## Sampling Rate

- **After every task commit:** Run exactly the task `<automated>` command from its PLAN task.
- **After every plan wave:** Run quick matrix:
  - `npm --workspace @superboard/api run test -- workflow-lifecycle.integration.test.ts -x`
  - `npm --workspace @superboard/api run test -- workflow-status-policy -x`
  - `npm --workspace @superboard/web run test -- jira-status-consistency.test.tsx -t "service contract"`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Test Type             | Automated Command                                                                                    | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------------------- | ---------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 01-01-01 | 01   | 0    | WFLO-01     | integration           | `npm --workspace @superboard/api run test -- workflow-lifecycle.integration.test.ts`                 | ❌ W0       | ⬜ pending |
| 01-01-02 | 01   | 1    | WFLO-01     | integration           | `npm --workspace @superboard/api run test -- workflow-lifecycle.integration.test.ts -x`              | ❌ W0       | ⬜ pending |
| 01-02-01 | 02   | 2    | WFLO-02     | integration           | `npm --workspace @superboard/api run test -- workflow-status-policy -x`                              | ❌ W0       | ⬜ pending |
| 01-03-01 | 03   | 3    | WFLO-02     | component/integration | `npm --workspace @superboard/web run test -- jira-status-consistency.test.tsx -t "service contract"` | ❌ W0       | ⬜ pending |
| 01-03-02 | 03   | 3    | WFLO-02     | e2e/manual-assisted   | `npm --workspace @superboard/web run test -- jira-status-consistency.test.tsx`                       | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `apps/api/test/workflow-lifecycle.integration.test.ts` — stubs for WFLO-01
- [ ] `apps/api/test/workflow-status-policy.spec.ts` — stubs for WFLO-02 API policy
- [ ] `apps/web/test/jira-status-consistency.test.tsx` — stubs for WFLO-02 UI consistency
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
- [ ] Feedback latency <= 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
