# SuperBoard — AI Features Brainstorm

> **Vision:** AI không phải addon — AI là trung tâm của mọi workflow.
> Mọi tính năng đều có AI tham gia chủ động, không chỉ khi user chủ động hỏi.

---

## Phân Loại

| Nhãn         | Ý nghĩa                                                      |
| ------------ | ------------------------------------------------------------ |
| 🟢 Product   | User thấy và dùng trực tiếp                                  |
| 🟠 Platform  | Hạ tầng AI — user không thấy nhưng mọi thứ phụ thuộc vào đây |
| 🔵 Wild      | Ý tưởng táo bạo, chưa phổ biến                               |
| 🔴 Deep Tech | Kỹ thuật nặng, học được nhiều nhất                           |

**Độ ưu tiên:** ⭐ Nên làm · 🔥 Impactful cao · 🔬 Kỹ thuật nâng cao · ✨ Nice to have

---

## 1 — AI Assistant (Trợ Lý Xuyên Suốt)

> Một AI biết toàn bộ workspace, tham gia vào mọi workflow.

| #   | Tính năng                        | Loại       | WOW | Mô tả                                                                                                                                             | Tech                                            |
| --- | -------------------------------- | ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1.1 | SuperBoard AI Chatbot            | 🟢 Product | ⭐  | Floating chat button. Hỏi "Tuần này team làm gì?", "Sprint nào đang chậm?", "Task nào overdue?" đều trả lời được. Biết toàn bộ workspace context. | RAG, LangChain, pgvector, streaming SSE         |
| 1.2 | Agentic AI — AI có thể hành động | 🔵 Wild    | 🔥  | Không chỉ trả lời — AI thực hiện: tạo task, assign người, gửi message, cập nhật doc theo lệnh. "Tạo task fix bug login và assign cho Nam"         | LangChain Agents, Function calling, Tool use    |
| 1.3 | Proactive AI Nudges              | 🔵 Wild    | ✨  | AI chủ động nhắc mà không cần hỏi: "Task này 5 ngày chưa update", "Nam đang overloaded — 12 tasks open", "Doc này outdated 3 tháng rồi"           | BullMQ cron, WebSocket push, scheduled analysis |
| 1.4 | Context-aware Suggestions        | 🟢 Product | ⭐  | Khi user mở task, AI tự hiểu context và gợi ý: docs liên quan, tasks tương tự đã done, người có kinh nghiệm với loại task này                     | Semantic similarity, pgvector, embedding        |
| 1.5 | AI Meeting Notes                 | 🟢 Product | ⭐  | Paste transcript buổi meeting → AI extract: action items, decisions, todos → tạo tasks và doc tóm tắt tự động                                     | LLM extraction, Structured output, Zod          |

---

## 2 — AI trên Tasks

> Làm việc thông minh hơn ở cấp độ task và project.

| #   | Tính năng                    | Loại         | WOW | Mô tả                                                                                                                                     | Tech                                                  |
| --- | ---------------------------- | ------------ | --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 2.1 | Smart Task Decomposition     | 🟢 Product   | ⭐  | Nhập 1 task mờ "Build authentication system" → AI phân tích → tạo subtasks chi tiết kèm acceptance criteria, estimate, suggested assignee | Structured LLM output, Function calling               |
| 2.2 | Auto-estimate Story Points   | 🔴 Deep Tech | 🔬  | AI học từ lịch sử completed tasks của team → estimate story points cho task mới dựa vào độ tương đồng. Càng dùng nhiều càng chính xác     | Embeddings similarity, ML regression, historical data |
| 2.3 | Bottleneck & Risk Detection  | 🟢 Product   | 🔥  | AI phân tích toàn sprint: task nào nguy cơ trễ, ai đang overloaded, dependency nào có thể gây block. Alert sớm 3 ngày trước deadline      | Statistical analysis, LLM reasoning, cron job         |
| 2.4 | Smart Task Routing           | 🟢 Product   | ⭐  | Task mới tạo → AI xem xét title, description, labels → đề xuất project, column, và người phù hợp nhất dựa theo track record               | Classification, embedding, historical data            |
| 2.5 | Duplicate Task Detection     | 🟢 Product   | ✨  | Khi tạo task, AI kiểm tra xem có task tương tự đã tồn tại (semantic similarity) → cảnh báo và link đến task gốc                           | Cosine similarity, pgvector, real-time check          |
| 2.6 | Sprint Retrospective AI      | 🟢 Product   | ⭐  | Cuối sprint: AI đọc toàn bộ tasks, commits, messages → tự viết retrospective: what went well, what didn't, action items cho sprint sau    | LLM summarization, structured output                  |
| 2.7 | Effort Distribution Analysis | 🔵 Wild      | ✨  | AI vẽ heat map: ai đang làm gì, ai rảnh, ai bị blocked. Gợi ý rebalance workload để tối ưu team velocity                                  | Data viz, ClickHouse, LLM analysis                    |
| 2.8 | AI Code Review trong Task    | 🔵 Wild      | 🔥  | Attach PR link vào task → AI đọc diff → comment trực tiếp: "PR này có thể gây N+1 query ở line 45, thiếu error handling cho edge case X"  | GitHub API, code analysis LLM, PR webhook             |

---

## 3 — AI trên Chat

> Chat thông minh hơn, ít noise hơn, giàu context hơn.

| #   | Tính năng                    | Loại       | WOW | Mô tả                                                                                                                       | Tech                                               |
| --- | ---------------------------- | ---------- | --- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 3.1 | Thread Summarization         | 🟢 Product | ⭐  | Nút "Tóm tắt thread" — AI đọc 50 tin nhắn và tóm thành 5 bullet points. Không còn phải đọc lại cả thread dài                | LLM summarization, context window                  |
| 3.2 | Action Item Extractor        | 🟢 Product | 🔥  | AI đọc conversation → extract action items → hỏi "Bạn có muốn tạo tasks không?" — 1 click là xong                           | Information extraction, structured LLM, BullMQ     |
| 3.3 | Smart Notification Filtering | 🔵 Wild    | ✨  | AI học behavior của user → chỉ notify những gì thực sự quan trọng với user đó. Giảm notification noise tới 80%              | User preference learning, ML classification        |
| 3.4 | Tone & Language Assistant    | 🟢 Product | ⭐  | Gõ message thô → AI polish: formal nếu cần, ngắn gọn hơn, hoặc translate sang tiếng Anh. Tùy context                        | LLM rewrite, tone detection                        |
| 3.5 | Auto-linking Context         | 🔵 Wild    | ✨  | Khi mention "cái bug hôm qua" trong chat, AI tự tìm và link đến task liên quan. Message trở nên có context                  | Semantic search, entity linking, pgvector          |
| 3.6 | Channel Digest AI            | 🟢 Product | ⭐  | Mỗi sáng 8h, AI gửi digest cá nhân hóa: hôm qua team làm gì, 3 decisions quan trọng, 5 tasks mới tạo                        | Scheduled LLM, email/notification, personalization |
| 3.7 | Smart Search trong Chat      | 🟢 Product | ⭐  | Tìm "cuộc thảo luận về database migration tuần trước" → semantic search, không cần nhớ keyword chính xác                    | Elasticsearch, pgvector, hybrid search             |
| 3.8 | AI Standup Bot               | 🔵 Wild    | 🔥  | Mỗi sáng, AI hỏi từng member qua DM: "Hôm qua làm gì? Hôm nay plan gì? Blocker không?" → tổng hợp post vào #standup tự động | Scheduled bot, DM automation, aggregation LLM      |

---

## 4 — AI trên Docs

> Editor thông minh — viết nhanh hơn, nghĩ rõ hơn.

| #   | Tính năng                       | Loại       | WOW | Mô tả                                                                                                                                | Tech                                                    |
| --- | ------------------------------- | ---------- | --- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 4.1 | AI Autocomplete (Copilot-style) | 🟢 Product | 🔥  | Gõ đến đâu, AI gợi ý tiếp đến đó — như GitHub Copilot nhưng cho văn xuôi. Hiểu context toàn bộ doc đang viết                         | TipTap extension, streaming LLM, debounce               |
| 4.2 | Slash AI Commands               | 🟢 Product | ⭐  | Trong editor: `/ai-write`, `/ai-improve`, `/ai-translate`, `/ai-shorten`, `/ai-expand`, `/ai-tone`. Mỗi command là 1 AI action       | TipTap slash cmd, LLM API, streaming                    |
| 4.3 | Doc Q&A                         | 🟢 Product | ⭐  | "Ask this doc" — chat với nội dung doc đang mở. "Section nào nói về authentication?", "Có edge case nào chưa cover?"                 | RAG trên single doc, LangChain, streaming               |
| 4.4 | Cross-doc Knowledge Graph       | 🔵 Wild    | 🔥  | AI tự phát hiện relationship giữa docs và tasks — visualize thành graph. Thấy ngay doc nào cần update khi feature thay đổi           | Graph DB, entity extraction, D3.js                      |
| 4.5 | Auto-generate PRD / Spec        | 🟢 Product | ⭐  | Từ task title + comments + similar past docs → AI draft PRD đầy đủ: problem statement, user stories, acceptance criteria, tech notes | Few-shot prompting, structured output, doc template     |
| 4.6 | Inconsistency Detection         | 🔵 Wild    | ✨  | AI đọc tất cả docs và phát hiện mâu thuẫn: "Doc A nói JWT, Doc B nói session-based" → alert team review                              | Cross-doc analysis, embedding comparison, LLM reasoning |
| 4.7 | Living Documentation            | 🔵 Wild    | 🔥  | Khi code thay đổi (GitHub webhook) → AI cập nhật doc liên quan: "API này đã thêm 2 params mới, cần update doc"                       | GitHub webhook, diff analysis, LLM update               |
| 4.8 | AI-powered Post-mortem          | 🔵 Wild    | 🔥  | Sau incident: AI đọc messages, tasks, commits trong khoảng thời gian → draft post-mortem: timeline, root cause, impact, action items | Timeline reconstruction, causal LLM, structured output  |

---

## 5 — AI Search & Discovery

> Tìm mọi thứ, hiểu mọi thứ — không chỉ bằng keyword.

| #   | Tính năng                       | Loại         | WOW | Mô tả                                                                                                                                                      | Tech                                                      |
| --- | ------------------------------- | ------------ | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 5.1 | Universal Semantic Search       | 🟢 Product   | ⭐  | 1 search box tìm tất cả: tasks, messages, docs, files, members. Hiểu ngữ nghĩa: "lỗi thanh toán" tìm ra cả task "payment bug" lẫn doc "stripe integration" | Elasticsearch + pgvector, hybrid search, re-ranking       |
| 5.2 | Similar Content Recommendations | 🟢 Product   | ⭐  | Đang xem task? AI gợi ý: tasks tương tự đã solved, docs liên quan, messages có đề cập. Như "Related articles" nhưng thông minh hơn                         | Embedding similarity, pgvector, cross-type search         |
| 5.3 | Natural Language Filters        | 🟢 Product   | 🔥  | Thay vì click filter, gõ: "tasks của Nam tuần trước chưa done" hay "docs chưa ai edit 30 ngày" → AI parse thành structured query                           | LLM to SQL/filter, query parsing, structured output       |
| 5.4 | Expertise Finder                | 🔵 Wild      | ✨  | "Ai trong team biết về Redis?" → AI phân tích: tasks đã làm, docs đã viết, messages đã gửi → rank members theo expertise                                   | Expertise modeling, activity analysis, vector similarity  |
| 5.5 | Workspace Knowledge Graph       | 🔴 Deep Tech | 🔬  | AI tự xây dựng và maintain knowledge graph của workspace: concepts, people, projects, relationships. Query bằng ngôn ngữ tự nhiên                          | Graph DB (Neo4j), entity extraction, relationship mapping |

---

## 6 — AI Analytics & Intelligence

> Biến data thành insight hành động được.

| #   | Tính năng                        | Loại         | WOW | Mô tả                                                                                                                           | Tech                                                         |
| --- | -------------------------------- | ------------ | --- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 6.1 | Velocity Predictor               | 🔴 Deep Tech | 🔬  | Dựa vào lịch sử sprint, AI predict: sprint này team có hoàn thành đúng hạn không, xác suất bao nhiêu, risk factors là gì        | Time series ML, historical data, ClickHouse                  |
| 6.2 | Anomaly Detection                | 🔴 Deep Tech | 🔬  | AI phát hiện pattern bất thường: tại sao sprint này PR merge chậm hơn 40%? Tại sao bug rate tăng? Correlate với external events | Statistical anomaly, ClickHouse, LLM explanation             |
| 6.3 | Team Health Score                | 🔵 Wild      | 🔥  | AI tổng hợp signals: overdue tasks, workload balance, sentiment messages → team health score + suggestions                      | Multi-signal analysis, NLP sentiment, LLM scoring            |
| 6.4 | AI-generated Weekly Report       | 🟢 Product   | ⭐  | Mỗi thứ 6, AI tự tạo report: highlights, blockers, team performance, next week outlook. Không cần viết tay nữa                  | Scheduled LLM, data aggregation, email delivery              |
| 6.5 | Churn / Disengagement Prediction | 🔵 Wild      | ✨  | AI phát hiện member đang disengaged: ít comment, task chậm dần → alert manager sớm để có action                                 | Behavioral ML, activity scoring, alert system                |
| 6.6 | AI OKR Tracking                  | 🟢 Product   | ⭐  | User nhập OKRs → AI liên tục track progress từ tasks và metrics → hàng tuần update % completion và suggest next actions         | LLM tracking, data aggregation, structured mapping           |
| 6.7 | Predictive Deadline Adjustment   | 🔵 Wild      | 🔥  | AI theo dõi velocity thực tế vs plan → khi thấy sprint sắp trễ → tự đề xuất reschedule, thông báo stakeholders trước 3 ngày     | Time series prediction, LLM suggestion, calendar integration |

---

## 7 — Wild Ideas (Táo Bạo Nhất)

> Những ý tưởng chưa ai làm — hoặc chưa làm tốt.

| #   | Tính năng                    | WOW | Mô tả                                                                                                                                                                    | Tech                                                |
| --- | ---------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 7.1 | Voice-to-Task                | 🔥  | Record voice memo → AI transcribe → tạo task với đủ fields tự động. Lý tưởng cho mobile: nghĩ ra task khi đang đi → nói 1 câu là xong                                    | Whisper (STT), LLM extraction, mobile PWA           |
| 7.2 | AI Negotiates Deadlines      | 🔥  | Khi deadline không thực tế: AI phân tích story points còn lại, team velocity, absences → đề xuất deadline khả thi kèm data. "Với pace hiện tại, xong 15/12 thay vì 1/12" | Velocity analysis, LLM reasoning, calendar          |
| 7.3 | AI Onboarding Companion      | ⭐  | Member mới join → AI tự tạo personalized onboarding: giới thiệu team, relevant docs, tasks nên đọc, suggest người nên connect                                            | Personalization, RAG, context-aware LLM             |
| 7.4 | Mood & Sentiment Tracking    | ✨  | AI đọc messages (với consent) → track team sentiment theo thời gian. Phát hiện frustration, celebrate wins. Chỉ aggregate, không individual tracking                     | Sentiment NLP, privacy-first, aggregate only        |
| 7.5 | Cross-workspace Benchmarking | ✨  | (Opt-in, anonymized) So sánh productivity metrics với industry average. "Team bạn deploy ít hơn 30% so với SaaS company cùng size"                                       | Federated analytics, privacy-preserving, ClickHouse |

---

## 8 — AI Platform & MLOps

> Hạ tầng để mọi tính năng trên có thể chạy tốt, tiết kiệm, và tự cải thiện.

### 8.1 Fine-tuning LLM Riêng

| #     | Tính năng                    | WOW | Mô tả                                                                                                                                       | Tech                                             |
| ----- | ---------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 8.1.1 | QLoRA Fine-tune Base Model   | 🔬  | Fine-tune Llama 3.1 8B hoặc Qwen2.5 7B (tốt cho tiếng Việt) trên data SuperBoard. Model hiểu domain: project management, team communication | LoRA/QLoRA, HuggingFace, PEFT, TRL, bitsandbytes |
| 8.1.2 | Dataset Pipeline tự động     | 🔬  | Airflow thu thập data mới từ workspace → clean → format thành instruction pairs (Alpaca) hoặc chat pairs (ChatML) → versioning với DVC      | Airflow, dbt, DVC, Great Expectations            |
| 8.1.3 | RLHF Feedback Loop           | 🔥  | Thumbs up/down trên mọi AI response → Airflow thu thập → format DPO pairs → fine-tune tiếp. Vòng lặp tự cải thiện không dừng                | DPO training, TRL, feedback collection           |
| 8.1.4 | Model Registry + A/B Testing | 🔬  | MLflow lưu tất cả versions. A/B test model cũ vs mới với 10% traffic. Chỉ rollout 100% khi win statistically                                | MLflow, canary deploy, statistical testing       |
| 8.1.5 | GPU Training Pipeline        | 🔬  | KubernetesPodOperator trong Airflow trigger training job trên GPU cloud (RunPod/Lambda Labs). Monitor realtime, notify khi xong             | K8s GPU operator, Airflow, W&B                   |

### 8.2 Model Serving

| #     | Tính năng                  | WOW | Mô tả                                                                                                                                | Tech                                      |
| ----- | -------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| 8.2.1 | vLLM Inference Server      | ⭐  | Serve fine-tuned model với PagedAttention, continuous batching. OpenAI-compatible API — không cần thay đổi code client               | vLLM, FastAPI, K8s                        |
| 8.2.2 | LLM Router — Smart Routing | 🔥  | Simple tasks → GPT-4o-mini (rẻ, nhanh). Complex reasoning → GPT-4o. Fine-tuned model → domain tasks. Tự động balance cost vs quality | LiteLLM, routing logic, cost tracking     |
| 8.2.3 | Semantic Cache             | ⭐  | Cache LLM responses bằng embedding similarity — câu hỏi tương tự không call API lại. Giảm cost 40–60%, latency <50ms                 | Redis, embedding cache, cosine similarity |
| 8.2.4 | Ollama Local Fallback      | ✨  | Khi OpenAI API down hoặc latency cao → fallback sang Ollama local. User không bao giờ thấy "AI không khả dụng"                       | Ollama, LiteLLM, circuit breaker          |

### 8.3 Airflow DAGs

| #     | DAG                          | Schedule         | Mô tả                                                                                                             |
| ----- | ---------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| 8.3.1 | `daily_data_ingestion`       | 1AM daily        | Extract data mới từ PostgreSQL + ClickHouse → transform → lưu Parquet vào MinIO Data Lake                         |
| 8.3.2 | `weekly_dataset_preparation` | 2AM Sunday       | Clean raw data, remove PII, format training pairs, validate với Great Expectations, push lên HuggingFace Datasets |
| 8.3.3 | `monthly_finetune_trigger`   | 1st of month     | Check đủ data mới (>500 pairs) → trigger GPU training job → monitor → notify khi xong                             |
| 8.3.4 | `model_evaluation_pipeline`  | On training done | Chạy eval benchmarks → so sánh với production model → auto-promote nếu tốt hơn 5%                                 |
| 8.3.5 | `model_deployment_pipeline`  | On eval passed   | Canary 10% → monitor 30 phút → nếu OK thì 100% rollout. Blue/green với K8s                                        |
| 8.3.6 | `rag_index_refresh`          | 3AM daily        | Re-embed documents mới/thay đổi → update pgvector index → warm up cache                                           |
| 8.3.7 | `data_drift_detection`       | Weekly           | Evidently AI so sánh distribution data production vs training. Alert khi drift > threshold                        |

### 8.4 Observability AI

| #     | Tính năng                   | Mô tả                                                                                         | Tool                      |
| ----- | --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| 8.4.1 | LLM Call Tracing            | Trace mọi LLM call: input/output, latency, cost, model version, user feedback                 | Langfuse (self-hosted)    |
| 8.4.2 | AI Cost Dashboard           | Token usage theo ngày/tháng, cost per feature, cost per workspace, forecast cuối tháng        | Prometheus + Grafana      |
| 8.4.3 | Model Performance Dashboard | Latency p95, error rate, queue depth, GPU utilization, cache hit rate                         | Grafana                   |
| 8.4.4 | Quality Monitor             | User feedback score theo thời gian, hallucination rate (LLM-as-judge), eval benchmark history | Grafana + Langfuse        |
| 8.4.5 | Data Pipeline Health        | DAG success rate, data freshness, dataset size growth                                         | Grafana + Airflow metrics |
| 8.4.6 | Data Drift Detection        | So sánh distribution data production vs training data. Alert khi cần retrain                  | Evidently AI + Prometheus |
| 8.4.7 | Training Monitor            | Loss curve realtime, GPU utilization, ETA, experiment comparison                              | W&B / MLflow              |
| 8.4.8 | RAG Quality Monitor         | Retrieval cosine scores, zero-result queries, context window usage                            | Grafana + Langfuse        |

### 8.5 Prometheus Metrics quan trọng nhất

```
ai_request_latency_seconds{feature, model}   — Histogram p50/p95/p99
ai_tokens_total{model, feature, workspace}    — Counter, tính cost
ai_requests_total{status, feature}            — Counter success/error/timeout
ai_cache_hit_ratio                            — Gauge semantic cache
model_serving_queue_depth                     — Gauge vLLM queue
eval_score{model_version, metric}             — Gauge BLEU/ROUGE/task score
user_feedback_score{feature}                  — Histogram thumbs up/down
data_pipeline_lag_seconds                     — Gauge data freshness
rag_retrieval_score                           — Histogram cosine similarity chunks
training_gpu_utilization                      — Gauge GPU usage % khi training
```

### 8.6 Data Safety

| #     | Tính năng                 | Mô tả                                                                                             | Tech                                 |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------ |
| 8.6.1 | PII Detection & Redaction | Detect và mask email, phone, password, token trước khi data đưa vào LLM hoặc training corpus      | Presidio, regex, NER model           |
| 8.6.2 | Data versioning           | Track dataset versions — biết model V2 train trên data nào, reproduce được                        | DVC                                  |
| 8.6.3 | Data quality gates        | Validate trước khi train: no PII leaked, no duplicates, format đúng, tỷ lệ tiếng Việt/Anh phù hợp | Great Expectations                   |
| 8.6.4 | Workspace data isolation  | Mỗi workspace chỉ được tìm kiếm và phân tích data của mình — không cross-tenant                   | PostgreSQL RLS, pgvector namespacing |

---

## 9 — Thư Viện Cần Học

| Nhóm              | Thư viện                | Mục đích                                                   |
| ----------------- | ----------------------- | ---------------------------------------------------------- |
| **LLM Training**  | `transformers`          | Load model, tokenizer, training loop                       |
|                   | `peft`                  | LoRA/QLoRA — get_peft_model, LoraConfig                    |
|                   | `trl`                   | SFTTrainer, DPOTrainer — high-level fine-tuning API        |
|                   | `bitsandbytes`          | 4-bit/8-bit quantization — chạy model 13B trên 1 GPU       |
|                   | `datasets`              | Load, process, push dataset. Arrow format, streaming       |
|                   | `accelerate`            | Multi-GPU, mixed precision, DeepSpeed                      |
| **Serving**       | `vllm`                  | Inference server: PagedAttention, continuous batching      |
|                   | `ollama`                | Local LLM cho dev và fallback                              |
|                   | `litellm`               | Unified API cho 100+ LLM providers + routing               |
| **RAG**           | `langchain`             | RAG pipeline, agents, chains                               |
|                   | `llama-index`           | Document indexing và retrieval                             |
|                   | `sentence-transformers` | Generate embeddings cho semantic search                    |
| **ML Tracking**   | `mlflow`                | Experiment tracking, model registry, artifact store        |
|                   | `wandb`                 | Training visualization, loss curves, experiment comparison |
|                   | `evidently`             | Data drift detection, model monitoring reports             |
| **Orchestration** | `apache-airflow`        | DAG, Operator, Hook, XCom — pipeline orchestration         |
|                   | `dvc`                   | Data version control — track datasets như git track code   |
|                   | `great-expectations`    | Data quality validation                                    |
| **Observability** | `langfuse`              | LLM observability — trace, cost, quality (self-hosted)     |
|                   | `presidio`              | PII detection và redaction                                 |
| **AI Native**     | `openai`                | GPT-4o, embeddings API                                     |
|                   | `google-generativeai`   | Gemini API                                                 |
|                   | `pgvector`              | Vector search trong PostgreSQL                             |

---

## 10 — Thứ Tự Triển Khai Khuyến Nghị

```
PHASE A — Foundation AI (làm song song với Pha 7 app)
  Semantic search (pgvector + embeddings)
  RAG chatbot cơ bản (LangChain + pgvector)
  AI Chatbot UI (streaming SSE)
  Langfuse observability

PHASE B — Product AI (sau khi Jira + Slack + Notion ổn định)
  Slash AI commands trong Docs editor
  Thread summarization trong Chat
  Task decomposition & smart routing
  AI-generated reports (weekly, sprint retro)

PHASE C — Platform AI (song song với Pha 8 infra)
  Airflow data pipeline (ingestion + dataset prep)
  MLflow model registry
  Semantic cache với Redis
  LLM Router (LiteLLM)
  AI cost dashboard (Grafana)

PHASE D — Advanced AI (sau khi platform ổn)
  QLoRA fine-tuning pipeline
  RLHF feedback collection + DPO training
  vLLM serving
  A/B testing models
  Data drift detection (Evidently)

PHASE E — Wild & Deep (optional, học thêm)
  Agentic AI (Function calling)
  Voice-to-task (Whisper)
  Knowledge graph (Neo4j)
  Workspace benchmarking
  Anomaly detection pipeline
```

---

## Tổng Hợp

| Nhóm                  | Số tính năng        |
| --------------------- | ------------------- |
| AI Assistant          | 5                   |
| AI trên Tasks         | 8                   |
| AI trên Chat          | 8                   |
| AI trên Docs          | 8                   |
| AI Search & Discovery | 5                   |
| AI Analytics          | 7                   |
| Wild Ideas            | 5                   |
| AI Platform & MLOps   | 30+                 |
| **Tổng**              | **~76 AI features** |

> Không cần làm hết — chọn theo thứ tự ưu tiên.
> Phase A + B đã đủ để có một AI-powered product ấn tượng.
> Phase C + D là nơi học được MLOps thực sự.

---

## 11 — Chiến Lược Tối Ưu Chi Phí & Token

> **Mục tiêu:** Giữ nguyên sức mạnh AI nhưng giảm 60-80% chi phí vận hành và tăng tốc độ phản hồi.

### 11.1 Kiến trúc "Tiered LLM" (Phân tầng Model)

- **Tier 1 (Siêu rẻ/Nhanh):** GPT-4o-mini, Gemini 1.5 Flash. Dùng cho: Trích xuất JSON, phân loại nhãn, tóm tắt thread ngắn, sửa lỗi chính tả.
- **Tier 2 (Thông minh/Đắt):** GPT-4o, Claude 3.5 Sonnet. Dùng cho: Lập luận phức tạp, dự báo rủi ro, phân tích báo cáo sâu, viết code.
- **Tier 3 (Local/Free):** Phi-3, Qwen2.5 (chạy qua Ollama/vLLM). Dùng cho: Các tác vụ nhạy cảm về privacy hoặc cần xử lý số lượng lớn data thô.

### 11.2 Semantic Caching (Bộ nhớ đệm ngữ nghĩa)

- **Cơ chế:** Lưu kết quả AI vào Redis cùng với vector của câu hỏi.
- **Hiệu quả:** Nếu câu hỏi mới giống câu cũ >95% (cosine similarity), trả về kết quả từ Cache ngay lập tức. Tiết kiệm 100% token cho các câu hỏi phổ biến.

### 11.3 Context Pruning (Gọt tỉa ngữ cảnh)

- **RAG thông minh:** Không ném cả document vào prompt. Chỉ lấy Top 3-5 chunks thực sự liên quan nhất.
- **Metadata-first:** Ưu tiên gửi metadata (JSON) thay vì text thô nếu AI chỉ cần thông tin trạng thái (vd: "Ai đang làm task SB-123?").
- **Sliding Window Summarization:** Đối với thread chat dài, AI tóm tắt theo từng block (vd: mỗi 50 tin nhắn) và lưu lại bản tóm tắt đó, thay vì đọc lại toàn bộ lịch sử mỗi lần.

### 11.4 Structured Output & Minimization

- **Strict JSON:** Ép AI trả về JSON thuần túy (không hội thoại rườm rà) để giảm output tokens.
- **System Prompt ngắn:** Tối ưu system prompt súc tích, sử dụng keyword thay vì câu văn dài dòng.

### 11.5 Edge AI cho Autocomplete

- **WebLLM / Transformers.js:** Chạy các model siêu nhỏ (100M-500M params) ngay trên trình duyệt user cho tính năng Autocomplete.
- **Kết quả:** Latency cực thấp (<100ms) và chi phí server bằng 0.
