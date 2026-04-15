# verify-fixes.md — ui-ux-consistency

## [2026-04-15] Round 1 (from spx-verify auto-fix)

### spx-arch-verifier

- Fixed: `task-board-view.tsx:130` — `getAllowedTargetStatuses` was a plain function causing stale closure in `allowedStatuses` useMemo. Wrapped with `useCallback` and added to deps array `[draggedTask, workflow, getAllowedTargetStatuses]`. Also added `useCallback` to the import.

### spx-uiux-verifier

- Fixed: `AIAutomationDialog.tsx` — "Neural Logic Engine" → "Tổng hợp logic AI"; "Synthesis_Module_Online" → "Module tổng hợp đang hoạt động"; "DEFINE_OBJECTIVE_SEQUENCE" → "MÔ TẢ QUY TẮC BẠN MUỐN"; "Sequence_Visualization" → "Luồng xử lý"; "Initialization" → "Khởi tạo"; "Trigger_Active" → "Đã kích hoạt"; "Execution" → "Thực thi"; "Payload_Ready" → "Sẵn sàng"; English description → Vietnamese; "Audit sequence before protocol activation" → "Kiểm tra chuỗi trước khi kích hoạt giao thức"; "Terminate" → "Hủy bỏ"

- Fixed: `workspace-health.tsx` — "Self-Organizing Heartbeat" → "Tự tổ chức theo dõi"; "Autonomous Workspace Refactoring" → "Tự động cải thiện workspace"; "System_Nominal_Heal_Ready" → "Hệ thống sẵn sàng"; "Trigger Heal Cycle" → "Chạy dọn dẹp"; "duplications detected" → "trùng lặp được phát hiện"; "Merge Recommended" → "Khuyến nghị gộp"; "Execute Merge" → "Thực hiện gộp"; "No Redundancies Detected" → "Không có trùng lặp"; "Archival Heartbeat" → "Nhịp dọn dẹp"; "No Archival Events" → "Không có sự kiện dọn dẹp"; "Health Operations" → "Thao tác sức khỏe"

- Fixed: `agent-activity-log.tsx` — "Agency Audit Log" → "Nhật ký tác vụ Agent"; "Autonomous Interventions" → "Can thiệp tự động"; "Active Agents" → "Agent đang hoạt động"; "Autonomous Decisions" → "Quyết định tự động"; "Human Override Rate" → "Tỷ lệ ghi đè thủ công"; "ago" suffix → `{ addSuffix: true }` locale-aware; "Reasoning Output" → "Đầu ra suy luận"; "No Agent Activity Detected" → "Không có hoạt động Agent"

- Fixed: `test-generator-modal.tsx` — "Autonomous Test Factory" → "Nhà máy test tự động"; "Synthetic Logic Simulation" → "Mô phỏng logic tổng hợp"

- Fixed: `SymbiosisConsole.tsx` — "Source" → "Nguồn"; "Target" → "Đích"; "Proposal Rationale" → "Cơ sở đề xuất"

- Fixed: `connect-hub.tsx` — "Configure" → "Cấu hình"

- Fixed: `project-copilot.tsx` — "Project Copilot" → "Copilot dự án"; "Context Aware Active" → "AI đang hoạt động"; "Neural Engine v4" → "Engine AI v4"; "Clears History" → "Xóa lịch sử"; "Settings" → "Cài đặt"

- Fixed: `knowledge-map.tsx` — "Knowledge Architecture" → "Kiến trúc tri thức"; "Generate Dev Diary" / "Synthesizing..." → "Tạo nhật ký dev" / "Đang tạo..."

- Fixed: `ConflictResolver.tsx` — "Workspace Aligned" → "Workspace đã đồng bộ"; English paragraph → "Mọi xung đột ngữ nghĩa đã được giải quyết."; "Ignore" → "Bỏ qua"

- Fixed: `neural-qa-dashboard.tsx` — "AI Diagnosis" → "Chẩn đoán AI"; "Neural Logic Scan" → "Quét logic Neural"; "Scanning..." / "Self-Heal" → "Đang quét..." / "Tự sửa"; "Proposed Fix" → "Đề xuất sửa lỗi"; "Open in IDE" → "Mở trong IDE"

- Fixed: `automation-slide-over.tsx` — "Tự động hóa Neural" → "Tự động hóa" (consistent with project-detail-header.tsx); "Dự phòng: Elite Fallback Active" → "Dự phòng: Hệ thống dự phòng hoạt động"; English placeholder → Vietnamese uppercase

- Fixed: `RichTextEditor.tsx` — Bubble menu labels "Improve" → "Cải thiện", "Shorten" → "Rút gọn", "Summarize" → "Tóm tắt"
