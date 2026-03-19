# Domain Pitfalls

**Domain:** AI-enhanced super app for software development teams (brownfield)
**Researched:** 2026-03-19
**Overall confidence:** MEDIUM-HIGH (official guidance + project-specific concerns)

## Critical Pitfalls

### Pitfall 1: “AI works in demo” nhưng không có evaluation harness cho production

**What goes wrong:** Team ship nhanh bằng manual testing/dogfooding, sau đó không phát hiện regression khi đổi prompt/model/tool.

**Warning signs:**

- Mỗi lần cập nhật prompt/model lại phải “test tay từ đầu”.
- Người dùng báo “agent dạo này tệ hơn” nhưng team không có metric phản biện.
- Không có tập test lấy từ bug thực tế; không có baseline pass rate theo thời gian.

**Prevention strategy:**

- Thiết lập eval-driven development sớm (20-50 case đầu từ bug/support logs).
- Tách **capability eval** và **regression eval**; chạy CI trước khi merge thay đổi AI.
- Lưu transcript + grader outputs để truy vết nguyên nhân fail.

**Suggested phase to address:**

- **Phase 1 (AI Foundation):** dựng eval harness tối thiểu + dataset seed.
- **Phase 2 (AI Task Generation):** bắt buộc regression gate cho prompt/model changes.

---

### Pitfall 2: Gắn AI vào luồng workflow mà thiếu security boundaries (prompt injection, excessive agency)

**What goes wrong:** AI được cấp quyền quá rộng (tool/file/network/action) trong hệ thống task/workspace, dẫn đến thao tác sai hoặc lộ dữ liệu.

**Warning signs:**

- Agent có thể gọi tool mutate dữ liệu mà không cần policy check rõ ràng.
- LLM output được dùng trực tiếp để thực thi command/action.
- Không có phân tách read-only vs write actions; không có approval cho high-impact actions.

**Prevention strategy:**

- Thiết kế zero-trust cho AI actions: output validation, policy enforcement, allowlist tool.
- Tách quyền theo cấp độ rủi ro (read, suggest, draft, execute).
- Sandbox execution + giới hạn network/FS cho các AI tool runtime có thể tự động hóa.

**Suggested phase to address:**

- **Phase 1 (AI Foundation):** policy engine + output sanitization + tool permission matrix.
- **Phase 3 (Autonomous/Agentic Actions):** sandbox + guarded execution rollout.

---

### Pitfall 3: Dùng dữ liệu workspace/project/task “thô” cho AI mà không có data contract

**What goes wrong:** Kết quả AI thiếu nhất quán hoặc sai bối cảnh vì schema/domain drift giữa API, shared DTO và AI service.

**Warning signs:**

- Prompt/response phụ thuộc field tạm thời, đổi schema là vỡ behavior.
- AI service trả output không tương thích contract frontend/backend.
- Tỷ lệ lỗi parse/validation tăng khi thêm trường nghiệp vụ mới.

**Prevention strategy:**

- Chuẩn hóa AI I/O contracts trong `packages/shared` (structured outputs, versioned schema).
- Bắt buộc schema validation ở cả ingress và egress của AI service.
- Thiết kế compatibility policy (deprecate fields theo version, không phá backward).

**Suggested phase to address:**

- **Phase 1 (AI Foundation):** contract-first + schema validation.
- **Phase 2 (AI Task Generation):** migrate toàn bộ flow sang structured outputs.

---

### Pitfall 4: Bỏ qua human-in-the-loop ở giai đoạn đầu

**What goes wrong:** Cho AI tạo/chỉnh task tự động ngay, dẫn đến sai ưu tiên, sai assignee, sai deadline và làm mất niềm tin sản phẩm.

**Warning signs:**

- Tỷ lệ người dùng sửa lại output AI rất cao.
- Các task AI tạo bị đóng/sửa ngay sau khi tạo.
- PM/lead yêu cầu “tắt AI” vì gây nhiễu board.

**Prevention strategy:**

- Mặc định AI ở mode **suggest-first** (draft, compare, accept/reject).
- Thu telemetry: accept rate, edit distance, override reason.
- Chỉ nâng autonomy khi pass ngưỡng chất lượng theo domain metric.

**Suggested phase to address:**

- **Phase 2 (AI Task Generation MVP):** human approval là bắt buộc.
- **Phase 4 (Optimization):** gradual autonomy sau khi đủ bằng chứng chất lượng.

---

### Pitfall 5: Không kiểm soát chi phí/độ trễ (unbounded consumption)

**What goes wrong:** Token/tool usage tăng ngoài dự kiến, p95 latency tăng mạnh, AI feature bị “đắt và chậm” nên không được dùng.

**Warning signs:**

- Không có budget guardrail theo request/user/workspace.
- Không đo token theo luồng nghiệp vụ; chỉ theo tổng chi phí tháng.
- Người dùng bỏ feature vì response quá chậm trong workflow hằng ngày.

**Prevention strategy:**

- Thiết lập guardrails: max tokens, max tool calls, timeout, fallback model.
- Thiết kế multi-model routing theo độ khó task.
- Theo dõi cost-to-value metric (cost/accepted suggestion, latency/accepted suggestion).

**Suggested phase to address:**

- **Phase 1 (AI Foundation):** quota + timeout + tracing bắt buộc.
- **Phase 4 (Optimization):** adaptive routing, caching, prompt compaction.

## Moderate Pitfalls

### Pitfall 6: Tích hợp AI như “module riêng lẻ”, không gắn vào observability chung

**What goes wrong:** Không debug được vì thiếu trace end-to-end từ web → API → AI service → data store.

**Warning signs:**

- Incident AI không có correlation ID xuyên service.
- Không phân biệt lỗi model, lỗi prompt, lỗi tool hay lỗi backend.

**Prevention strategy:**

- Chuẩn hóa request context/correlation ID xuyên web, API, AI service.
- Log transcript metadata (không lộ PII), tool calls, latency breakdown.

**Suggested phase to address:**

- **Phase 1 (AI Foundation):** observability contract cho AI request lifecycle.

---

### Pitfall 7: Không có rollout strategy theo mức rủi ro

**What goes wrong:** Bật AI đồng loạt cho tất cả workspace/user trước khi có canary/A-B guardrails.

**Warning signs:**

- Sự cố AI ảnh hưởng toàn bộ tenant cùng lúc.
- Không có feature flag theo workspace hoặc capability.

**Prevention strategy:**

- Progressive rollout: internal dogfood → selected workspaces → broader release.
- Kill switch theo capability và per-tenant flags.

**Suggested phase to address:**

- **Phase 2 (MVP Rollout):** rollout policy + kill switch trước GA.

## Minor Pitfalls

### Pitfall 8: Kỳ vọng sai về mức “thông minh” của AI trong domain software workflow

**What goes wrong:** Team kỳ vọng AI tự hiểu toàn bộ domain/project context, dẫn tới thiết kế prompt mơ hồ và thất vọng chất lượng.

**Warning signs:**

- Prompt mô tả chung chung, thiếu constraints/acceptance criteria.
- Kết quả dao động mạnh giữa các lần chạy cùng input gần tương tự.

**Prevention strategy:**

- Productize prompt inputs: objective, constraints, project context, definition of done.
- Chuẩn hóa template theo loại task (bugfix, feature, refactor, research).

**Suggested phase to address:**

- **Phase 2 (AI Task Generation MVP):** prompt templates + UX for context capture.

## Phase-Specific Warnings

| Phase Topic              | Likely Pitfall                               | Mitigation                                                    |
| ------------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| AI Foundation            | Thiếu contracts/evals/guardrails ngay từ đầu | Contract-first + minimum eval suite + policy sandbox          |
| Task Generation MVP      | Bỏ qua human review, bật auto-create quá sớm | Suggest-first UX, approval gate, rollback                     |
| Agentic Actions          | Excessive agency và tool abuse               | Permission matrix, action risk tiers, sandboxed execution     |
| Scale & Optimization     | Chi phí/latency vượt ngưỡng sử dụng thực tế  | Budget guardrails, model routing, caching, performance SLO    |
| Reliability & Governance | Drift/regression không được phát hiện sớm    | Continuous eval + production monitoring + transcript sampling |

## Confidence Notes

- **HIGH:** Pitfalls về evaluation lifecycle, prompt injection/excessive agency, output handling, unbounded consumption (được củng cố bởi OWASP GenAI Top 10 2025 + hướng dẫn eval của OpenAI + thực tiễn engineering).
- **MEDIUM:** Mapping phase cụ thể theo roadmap SuperBoard (vì roadmap phase chi tiết chưa được chốt trong `.planning/`).
- **HIGH:** Tính phù hợp với codebase hiện tại (AI service placeholder, thiếu test automation, auth/token risk, thiếu observability sâu) dựa trên `.planning/codebase/CONCERNS.md`.

## Sources

- `.planning/PROJECT.md` (brownfield scope, MVP priorities)
- `.planning/codebase/CONCERNS.md` (current risk profile)
- OWASP GenAI Security Project – Top 10 for LLM/GenAI Apps 2025: https://genai.owasp.org/llm-top-10/
- OpenAI Docs – Working with evals: https://developers.openai.com/api/docs/guides/evals
- Anthropic Engineering – Demystifying evals for AI agents (2026-01-09): https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- Anthropic Engineering – Claude Code sandboxing (2025-10-20): https://www.anthropic.com/engineering/claude-code-sandboxing
- NIST AI RMF + GenAI Profile references: https://www.nist.gov/itl/ai-risk-management-framework
- Google Cloud Architecture – MLOps CI/CD/CT pitfalls and operating guidance (last reviewed 2024-08-28): https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning
