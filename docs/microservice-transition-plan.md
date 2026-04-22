# Kế Hoạch Chuyển Đổi Sang Microservice Cho SuperBoard

> Mục tiêu: giữ monorepo, nhưng tách triển khai theo service độc lập từng bước để giảm coupling, tăng khả năng scale và dễ maintain hơn.

## 1. Mục tiêu chuyển đổi

SuperBoard hiện đang là một monorepo với core API lớn, cộng thêm các thành phần đã có dấu hiệu tách rời như AI service và collaboration service. Hướng chuyển đổi phù hợp không phải là viết lại toàn bộ sang microservice ngay, mà là:

- Giữ 1 repo để chia sẻ contract, types, build tooling và CI.
- Tách runtime theo service riêng khi có boundary rõ.
- Ưu tiên tách những phần có tải khác nhịp với core product.
- Tránh phá vỡ luồng nghiệp vụ chính như workspace, project, task, workflow.

## 1.1 Vấn đề hiện trạng cần xử lý song song

Ngoài mục tiêu tách service, hệ thống hiện tại đang có các vấn đề ảnh hưởng trực tiếp đến maintainability và tốc độ phát triển. Cần đưa vào kế hoạch chính thức thay vì xử lý rải rác.

### Nhóm vấn đề A: Lặp code và logic phân tán

- Logic tương tự xuất hiện ở nhiều module nhưng chưa có abstraction dùng chung.
- Một số luồng xử lý cross-cutting (error mapping, retry, logging context) chưa được gom thành chuẩn chung.
- Dễ tạo bug khi sửa một chỗ nhưng bỏ sót các chỗ tương tự.

### Nhóm vấn đề B: Code không đồng bộ theo chuẩn

- Quy ước DTO, response shape, naming và lỗi trả về chưa đồng nhất tuyệt đối giữa các module.
- Một số phần dùng fallback ad-hoc thay vì chiến lược nhất quán toàn hệ thống.
- Chất lượng test giữa các domain không cân bằng, khiến refactor khó tự tin.

### Nhóm vấn đề C: Khó scale theo domain

- Core API đang gánh quá nhiều trách nhiệm, bao gồm cả các workload không cần chạy trong request path.
- Realtime, AI, notification và automation có nhịp tải khác nhau nhưng chưa tách triệt để.
- Khi mở rộng tính năng dễ phát sinh coupling chéo giữa module.

## 1.2 Mục tiêu kỹ thuật bổ sung (bắt buộc trước khi tách sâu)

- Giảm lặp code có hệ thống: đo được, ưu tiên theo tác động.
- Chuẩn hóa kiến trúc nội bộ: contract, error, logging, retry, idempotency.
- Thiết lập guardrail chất lượng: lint rules, boundary rules, test gates.
- Tách async workloads khỏi request path trước khi tách thêm service mới.

## 2. Nguyên tắc kiến trúc

### 2.1 Nguyên tắc giữ lại

- Core domain vẫn ở trong một API chính trong giai đoạn đầu.
- Không cho service này query trực tiếp DB của service khác.
- Không tách theo layer kỹ thuật, chỉ tách theo bounded context.
- Không big-bang rewrite.

### 2.2 Nguyên tắc tách ra

- Mỗi service sở hữu dữ liệu và logic nghiệp vụ của mình.
- Giao tiếp giữa service phải có contract rõ ràng.
- Luồng không cần phản hồi ngay thì dùng event/queue.
- Luồng cần phản hồi ngay thì dùng HTTP hoặc gRPC.
- Mọi request xuyên service phải có correlation id.

## 3. Bản đồ service đề xuất

### 3.1 Core API

Giữ lại trong service chính:

- Auth
- Workspace
- Project
- Task
- Workflow
- Permission / RBAC
- Audit log lõi

Vai trò:

- Là nguồn dữ liệu chính cho nghiệp vụ lõi.
- Phát event khi dữ liệu thay đổi.
- Là API gateway nghiệp vụ cho phần lớn thao tác CRUD.

### 3.2 AI Service

Tách riêng và nâng cấp thành service độc lập:

- Summarize task/doc/chat
- Project briefing
- Workspace digest
- Orchestrate goal
- Suggest labels / priority
- Embedding / semantic search
- Training dataset export

Vai trò:

- Scale theo nhu cầu AI.
- Có thể đổi provider mà không chạm core API.
- Nhận event để tự sinh summary, score, suggestion.

### 3.3 Collaboration Service

Tách riêng realtime collaboration:

- Presence
- Typing indicator
- Chat realtime
- Project events
- Doc sync / editor collaboration

Vai trò:

- Scale theo số kết nối realtime.
- Không làm core API bị kéo theo bởi websocket load.
- Làm gateway realtime cho web client.

### 3.4 Notification Service

Tách xử lý thông báo ra khỏi request path:

- In-app notification
- Email notification
- Digest / reminder
- Retry / dead-letter handling

Vai trò:

- Xử lý async.
- Không ảnh hưởng user request chính nếu gửi mail thất bại.

### 3.5 Search / Analytics / Automation

Tách sau cùng khi có nhu cầu thực:

- Search indexing
- Analytics pipeline
- Automation engine

Vai trò:

- Nhận event từ core.
- Tính toán nền, không nằm trong request path.

## 4. Thứ tự triển khai

### Pha -1: Ổn định cấu trúc nội bộ trước khi tách sâu

Mục tiêu: giảm nợ kỹ thuật hiện trạng để việc tách service không làm tình hình tệ hơn.

Việc cần làm:

- Lập danh sách code trùng theo nhóm: validation, mapping, error handling, transport adapter.
- Tạo thư viện dùng chung trong phạm vi monorepo cho các phần lặp nhiều.
- Chuẩn hóa `ApiResponse` và error envelope cho toàn bộ API endpoints.
- Chuẩn hóa conventions: naming, folder boundary, module public API.
- Áp dụng check tự động trong CI:
  - lint + typecheck bắt buộc theo app
  - boundary rule để chặn import chéo sai tầng
  - test tối thiểu cho module bị thay đổi
- Thiết lập baseline metric để đo tiến bộ:
  - tỷ lệ module có test
  - số lỗi lint/type theo app
  - thời gian build/test trung bình

Output mong muốn:

- Giảm rõ rệt phần code trùng và logic copy-paste.
- Luồng xử lý lỗi và contract thống nhất.
- Refactor an toàn hơn trước khi tách runtime.

### Pha 0: Chuẩn hóa nền tảng

Mục tiêu: repo sẵn sàng cho tách service mà không vỡ build/deploy.

Việc cần làm:

- Mỗi app/service có Dockerfile riêng.
- Mỗi service có health check riêng.
- Tách env theo service.
- Chuẩn hóa shared package cho DTO, schema, event types.
- Chuẩn hóa naming, port, logging format.
- Thêm correlation id xuyên request.

Output mong muốn:

- 1 repo, nhiều service build được riêng.
- Không cần deploy cùng lúc toàn bộ.

### Pha 1: Cố định contract

Mục tiêu: chặn việc phụ thuộc lẫn nhau bằng code trực tiếp.

Việc cần làm:

- Định nghĩa DTO chung cho request/response.
- Định nghĩa protobuf cho AI gRPC.
- Định nghĩa event schema versioned.
- Định nghĩa timeout, retry, idempotency cho từng loại call.
- Chuẩn hóa lỗi trả về.

Output mong muốn:

- Service nào cũng có contract rõ.
- Dễ mock và test tích hợp.

### Pha 2: Harden AI Service

Mục tiêu: biến AI thành service độc lập thật sự.

Việc cần làm:

- Giữ gRPC làm kênh chính giữa core API và AI.
- Chốt các use case AI ưu tiên:
  - summarize
  - briefing
  - orchestration
  - embeddings
  - suggest labels / priority
- Tách fallback logic rõ ràng.
- Thêm cache và timeout policy.
- Thêm telemetry cho request AI.
- Lưu signal để phục vụ cải thiện chất lượng.

Output mong muốn:

- AI service có thể deploy riêng.
- Core API chỉ giữ integration layer.

### Pha 3: Tách Collaboration Service

Mục tiêu: đưa realtime ra khỏi core API.

Việc cần làm:

- Chuyển websocket gateway sang service riêng.
- Tách channel cho chat, project events, doc collaboration.
- Đồng bộ auth cho socket connection.
- Dùng event bus hoặc Redis pub/sub nếu cần fan-out.
- Đảm bảo presence/typing/doc sync chạy độc lập với CRUD.

Output mong muốn:

- Scale realtime độc lập với core API.
- Giảm load websocket lên NestJS API chính.

### Pha 4: Tách Notification Service

Mục tiêu: mọi gửi thông báo trở thành async.

Việc cần làm:

- Dùng queue làm hàng đợi chuẩn.
- Core API chỉ enqueue event/job.
- Worker xử lý email, in-app, digest, reminder.
- Có retry, backoff, dead-letter queue.
- Có idempotency để tránh gửi trùng.

Output mong muốn:

- Notification lỗi không ảnh hưởng transaction chính.
- Có thể scale worker riêng.

### Pha 5: Event-driven hóa các luồng chéo

Mục tiêu: giảm gọi chéo sync giữa services.

Luồng nên phát event:

- Task created / updated / status changed
- Doc updated / version created
- Message sent / reaction added
- Project updated
- User invited / member joined

Service nghe event:

- AI nghe để summarize, score, suggest
- Notification nghe để gửi thông báo
- Search nghe để index
- Analytics nghe để tính health / trend

Output mong muốn:

- Core API không còn phải biết hết side effects.
- Các service phụ phản ứng theo event.

### Pha 6: Tách Search / Analytics / Automation nếu có tải thực

Mục tiêu: chỉ tách khi hệ thống đã cho thấy nhu cầu.

Việc cần làm:

- Search service nhận event và cập nhật index.
- Analytics service tính KPI, usage, health.
- Automation service xử lý rule engine và job automation.

Output mong muốn:

- Core API nhẹ hơn.
- Các workload nặng chạy nền độc lập.

## 5. Data ownership

### 5.1 Nguyên tắc

- Mỗi service phải có dữ liệu sở hữu riêng.
- Không join cross-service bằng database query.
- Không dùng một schema lớn chung cho mọi thứ mãi mãi.

### 5.2 Hướng thực tế cho SuperBoard

- Core API: user, workspace, project, task, workflow.
- AI Service: cache, embeddings, prompt logs, signal logs.
- Collaboration Service: realtime state, socket presence, ephemeral sync state.
- Notification Service: queue state, delivery state, retry history.
- Search Service: index state.

### 5.3 Cách chia dữ liệu chuyển tiếp

Trong giai đoạn chuyển đổi, có thể đi theo 2 bước:

- Bước 1: cùng database nhưng schema/ownership phân vùng rõ.
- Bước 2: tách database riêng khi service ổn định.

## 6. Cách giao tiếp giữa services

### 6.1 Sync

Dùng cho:

- Query cần phản hồi ngay
- AI request tương tác trực tiếp
- Auth / profile lookup

Kênh:

- HTTP
- gRPC

### 6.2 Async

Dùng cho:

- Notification
- Search indexing
- Analytics
- AI enrichment
- Automation rules

Kênh:

- Queue
- Event bus
- Redis pub/sub trong giai đoạn đầu

### 6.3 Chuẩn giao tiếp tối thiểu

- Request id / correlation id
- Timeout
- Retry with backoff
- Idempotent handler
- Versioned payload

## 7. Hạ tầng cần có

### 7.1 Local development

- 1 repo, chạy từng service bằng Docker Compose hoặc task riêng.
- Có thể dùng VM hoặc container isolation để gần production hơn.
- Mỗi service có port và health check riêng.

### 7.2 Observability

- Structured logging.
- Metrics per service.
- Tracing xuyên service.
- Alert cho job failure và queue backlog.

### 7.3 Deployment

- Build riêng từng service.
- Deploy độc lập.
- Có rollback riêng.
- Có env config riêng.

## 8. Test strategy

### 8.1 Unit tests

- Mỗi service test logic nội bộ.
- Test contract validation.
- Test idempotency và error handling.

### 8.2 Integration tests

- Core API gọi AI / notification / collab.
- Event producer / consumer.
- Queue handling.

### 8.3 E2E tests

- Tạo task → sinh event → notify → summarize.
- Chat / presence / doc sync.
- Invite member → audit → notification.

### 8.4 Quality gate bổ sung để trị vấn đề hiện trạng

- Mỗi PR phải qua:
  - lint + typecheck cho app bị ảnh hưởng
  - unit test cho module bị đổi
  - integration test nếu có thay đổi contract hoặc event payload
- Mỗi tuần chạy một đợt kiểm tra duplicate code và cập nhật backlog xử lý.
- Không merge thay đổi cross-module nếu thiếu test cho boundary mới tạo.

## 9. Rủi ro cần quản lý

- Tăng complexity vận hành.
- Khó debug nếu thiếu tracing.
- Dễ sinh data inconsistency.
- Dễ tốn thời gian cho network overhead.
- Dễ over-engineer nếu tách quá sớm.

Cách giảm rủi ro:

- Tách từ service ít rủi ro trước.
- Giữ core API lâu hơn.
- Bắt buộc contract và observability.
- Không tách khi chưa có nhu cầu scale thực.

## 10. Tiêu chí thành công

Bạn nên coi việc chuyển đổi là đạt nếu:

- Core API nhẹ hơn và ổn định hơn.
- AI, realtime, notification có thể scale riêng.
- Lỗi một service không kéo sập toàn hệ thống.
- Debug được một request xuyên qua nhiều service.
- Team có thể deploy từng service độc lập.

## 11. Roadmap đề xuất theo tuần

### Tuần 0

- Audit nhanh code trùng và điểm không đồng bộ.
- Chốt coding standards và boundary rules.
- Chốt KPI cải tiến maintainability.

### Tuần 1

- Giảm lặp code nhóm ưu tiên cao (error/response/mapping).
- Chuẩn hóa contract shared.
- Chuẩn hóa logging và correlation id.

### Tuần 2

- Hoàn tất Pha 0 (microservice-ready foundation).
- Hardening AI service.
- Chuẩn hóa gRPC / retry / timeout.

### Tuần 3

- Tách collaboration runtime.
- Chuẩn hóa auth cho websocket.
- Kiểm tra presence / typing / doc sync.

### Tuần 4

- Tách notification worker.
- Chuẩn hóa queue / retry / DLQ.
- Core API chỉ enqueue job.

### Tuần 5

- Phát event từ core cho task/doc/project.
- AI và notification nghe event.
- Bổ sung integration tests.

### Tuần 6

- Đánh giá tải thật và quality trend.
- Quyết định có tách search / analytics / automation hay chưa.
- Chốt backlog nợ kỹ thuật vòng 2.

## 11.1 Checklist triển khai nhanh (dễ áp dụng)

### Checklist A: Giảm lặp code

- [ ] Tạo danh sách 20 điểm lặp lớn nhất theo mức ảnh hưởng.
- [ ] Gom nhóm helper dùng chung: validation, mapper, error translator.
- [ ] Cấm copy/paste utility giữa module, bắt buộc import từ package chung.

### Checklist B: Đồng bộ chuẩn code

- [ ] Chuẩn hóa response envelope cho toàn bộ controller mới.
- [ ] Chuẩn hóa error code và thông điệp theo domain.
- [ ] Chuẩn hóa cấu trúc module: controller, service, dto, mapper, policy.
- [ ] Áp dụng lint rule cho import boundary và naming.

### Checklist C: Chuẩn bị scale

- [ ] Chuyển side effects nặng sang queue/event.
- [ ] Đặt timeout và retry mặc định cho call xuyên service.
- [ ] Thêm metrics cho throughput, latency, error rate theo service.
- [ ] Đảm bảo service tách ra có health check và readiness check.

## 12. Kết luận

Chiến lược đúng cho SuperBoard là:

- 1 repo.
- Nhiều service.
- Tách runtime dần dần.
- Core monolith giữ lâu hơn.
- Tách trước AI, collaboration, notification.
- Dùng event/queue để giảm coupling.

Đây là đường ít rủi ro nhất để chuyển từ hệ thống lớn sang microservice mà không làm dự án khó maintain hơn trong ngắn hạn.

## 13. Backlog triển khai dạng issue (owner + priority + effort + done criteria)

> Quy ước owner (vai trò):
>
> - `BE-Core`: Backend core domain
> - `BE-Platform`: Infra, CI/CD, observability
> - `BE-AI`: AI integration/service
> - `BE-Realtime`: WebSocket/collaboration
> - `QA`: Kiểm thử và quality gate

> Quy ước effort:
>
> - `S`: 0.5-1 ngày
> - `M`: 2-3 ngày
> - `L`: 4-6 ngày

### Epic A - Ổn định maintainability trước khi tách sâu

#### Issue A1 - Audit và đo duplicate code baseline

- Owner: `BE-Core`
- Priority: `P0`
- Effort: `M`
- Dependencies: Không
- Scope:
  - Quét duplicate code theo nhóm: validation, mapper, response, error handling.
  - Lập bảng top 20 điểm lặp theo mức ảnh hưởng.
- Done criteria:
  - Có file báo cáo baseline duplicate (top 20).
  - Mỗi điểm lặp có: vị trí, mức độ ảnh hưởng, hướng gom.

#### Issue A2 - Chuẩn hóa response envelope toàn API

- Owner: `BE-Core`
- Priority: `P0`
- Effort: `M`
- Dependencies: A1
- Scope:
  - Áp dụng thống nhất `ApiResponse<T>` cho endpoint mới/chỉnh sửa.
  - Loại bỏ response shape tùy biến không cần thiết.
- Done criteria:
  - 100% endpoint chạm trong sprint tuân theo envelope chuẩn.
  - Có guideline ngắn trong docs về response contract.

#### Issue A3 - Chuẩn hóa error code theo domain

- Owner: `BE-Core`
- Priority: `P0`
- Effort: `M`
- Dependencies: A2
- Scope:
  - Thiết kế bộ error code cho auth/workspace/project/task.
  - Map exception thống nhất tại layer filter.
- Done criteria:
  - Có danh sách error code phiên bản 1.
  - Endpoint chỉnh sửa trong sprint trả lỗi theo chuẩn mới.

#### Issue A4 - Boundary rule chống import chéo sai tầng

- Owner: `BE-Platform`
- Priority: `P1`
- Effort: `S`
- Dependencies: Không
- Scope:
  - Thêm lint/boundary rule để chặn import xuyên module không hợp lệ.
  - Fail CI khi vi phạm.
- Done criteria:
  - CI chặn được tối thiểu 3 pattern import sai phổ biến.
  - Có hướng dẫn xử lý vi phạm trong docs nội bộ.

### Epic B - Làm monorepo microservice-ready

#### Issue B1 - Chuẩn hóa service config và health checks

- Owner: `BE-Platform`
- Priority: `P0`
- Effort: `M`
- Dependencies: A4
- Scope:
  - Mỗi service có config env riêng, readiness/liveness check riêng.
  - Chuẩn hóa naming biến môi trường và cổng.
- Done criteria:
  - Core API, AI, Collab đều có endpoint health rõ ràng.
  - Có checklist vận hành local/staging cho từng service.

#### Issue B2 - Chuẩn hóa correlation id xuyên service

- Owner: `BE-Platform`
- Priority: `P0`
- Effort: `M`
- Dependencies: B1
- Scope:
  - Inject và propagate correlation id qua HTTP/gRPC/queue.
  - Log format đồng nhất để trace end-to-end.
- Done criteria:
  - Truy vết được 1 request đi qua tối thiểu 2 service.
  - Dashboard log lọc theo correlation id hoạt động.

#### Issue B3 - Contract package cho DTO/Event/Proto

- Owner: `BE-Core`
- Priority: `P1`
- Effort: `L`
- Dependencies: A2, A3
- Scope:
  - Chốt nơi đặt và versioning cho DTO/event schema/protobuf.
  - Loại bỏ contract phân tán trong service code.
- Done criteria:
  - Contract được import từ package chuẩn, không copy local.
  - Có changelog version cho contract.

### Epic C - Tách runtime theo thứ tự rủi ro thấp

#### Issue C1 - Harden AI service integration

- Owner: `BE-AI`
- Priority: `P0`
- Effort: `L`
- Dependencies: B2, B3
- Scope:
  - Chuẩn hóa timeout/retry/circuit-breaker cho call AI.
  - Chốt mode fallback theo use case (không ad-hoc).
  - Thêm telemetry chất lượng response.
- Done criteria:
  - Tỷ lệ lỗi call AI giảm theo ngưỡng mục tiêu sprint.
  - Có dashboard latency/error cho AI endpoints chính.

#### Issue C2 - Tách collaboration gateway khỏi core API

- Owner: `BE-Realtime`
- Priority: `P1`
- Effort: `L`
- Dependencies: B1, B2
- Scope:
  - Chuyển chat/project events/presence về collab runtime.
  - Đồng bộ auth handshake cho socket.
- Done criteria:
  - Core API không còn xử lý gateway realtime chính.
  - Test realtime flow pass cho join/leave/typing/presence.

#### Issue C3 - Tách notification worker async

- Owner: `BE-Core`
- Priority: `P1`
- Effort: `M`
- Dependencies: B2
- Scope:
  - Core API chỉ enqueue event/job.
  - Worker xử lý gửi mail/in-app có retry và idempotency.
- Done criteria:
  - Luồng gửi thông báo không còn nằm trong request path.
  - Có số liệu queue backlog và failed jobs.

### Epic D - Event-driven giảm coupling

#### Issue D1 - Event taxonomy v1

- Owner: `BE-Core`
- Priority: `P1`
- Effort: `M`
- Dependencies: B3
- Scope:
  - Định nghĩa danh sách event chuẩn: task/doc/message/project/user.
  - Chốt convention version và payload metadata.
- Done criteria:
  - Có tài liệu event taxonomy v1.
  - Service producer/consumer đầu tiên dùng schema mới.

#### Issue D2 - Producer chuẩn cho core domain events

- Owner: `BE-Core`
- Priority: `P1`
- Effort: `L`
- Dependencies: D1
- Scope:
  - Phát event từ các luồng task/doc/project quan trọng.
  - Bảo đảm idempotency key và retry policy.
- Done criteria:
  - Có event phát ra ổn định từ 3 domain chính.
  - Không phát duplicate event trong cùng transaction logic.

#### Issue D3 - Consumer chuẩn cho AI + Notification

- Owner: `BE-AI`
- Priority: `P2`
- Effort: `M`
- Dependencies: D2
- Scope:
  - AI và Notification consume event qua contract chung.
  - Có dead-letter handling cho event lỗi.
- Done criteria:
  - AI enrichment + notify chạy từ event flow thay vì gọi sync.
  - Có thống kê success/fail của consumer.

### Epic E - Quality gates chống tái phát nợ kỹ thuật

#### Issue E1 - PR quality gate bắt buộc

- Owner: `QA`
- Priority: `P0`
- Effort: `S`
- Dependencies: A4
- Scope:
  - PR phải pass lint + typecheck.
  - Module đổi phải có unit test tương ứng.
- Done criteria:
  - Branch protection bật cho các check bắt buộc.
  - Không merge được PR thiếu check bắt buộc.

#### Issue E2 - Integration gate cho contract/event changes

- Owner: `QA`
- Priority: `P1`
- Effort: `M`
- Dependencies: B3, D1
- Scope:
  - Khi đổi contract/event payload phải chạy integration tests liên quan.
  - Fail fast nếu mismatch schema.
- Done criteria:
  - Có pipeline riêng cho contract compatibility.
  - Có ít nhất 3 test case contract break bị chặn tự động.

#### Issue E3 - Weekly technical debt review

- Owner: `BE-Platform`
- Priority: `P2`
- Effort: `S`
- Dependencies: A1
- Scope:
  - Mỗi tuần review duplicate hotspots, flaky test, queue failures.
  - Cập nhật lại backlog và ưu tiên tuần kế tiếp.
- Done criteria:
  - Có biên bản review hàng tuần.
  - Backlog được cập nhật trạng thái và ưu tiên rõ ràng.

## 14. Cách triển khai backlog cho team nhỏ (3-5 người)

- Sprint 1: A1, A2, A4, E1
- Sprint 2: A3, B1, B2
- Sprint 3: B3, C1
- Sprint 4: C2, C3
- Sprint 5: D1, D2, E2
- Sprint 6: D3, E3 + tổng kết KPI

Nếu nguồn lực ít hơn, giữ nguyên thứ tự ưu tiên `P0 -> P1 -> P2`, không làm song song quá 2 issue `L` trong cùng sprint.
