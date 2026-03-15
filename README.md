# SuperBoard

SuperBoard là dự án fullstack monorepo theo định hướng production: Next.js (web), NestJS (API), FastAPI (AI service), cùng hạ tầng local qua Docker Compose.

## 1) Yêu cầu môi trường

- Node.js >= 20.11
- npm >= 10
- Python 3.9+ (khuyến nghị 3.12)
- Docker Desktop

## 2) Cài đặt lần đầu

```bash
git clone <repo-url>
cd SuperBoard

# Node dependencies cho toàn monorepo
npm install

# Python venv (nếu chưa có)
python3 -m venv .venv

# Python dependencies cho AI service
./.venv/bin/pip install -r apps/ai-service/requirements.txt

# Bootstrap project (check môi trường + tạo .env.local nếu chưa có)
npm run setup
```

## 3) Chạy dự án local

Lưu ý: PostgreSQL trong Docker map ra host port `5433` để tránh trùng với Postgres local.

```bash
# Start infra (postgres, redis, minio, keycloak, mailhog)
npm run dev:infra

# Chạy đồng thời web + api + ai-service
npm run dev
```

`npm run dev` hiện chạy song song:
- `@superboard/web` tại `http://localhost:3000`
- `@superboard/api` tại `http://localhost:4000`
- `@superboard/ai-service` tại `http://localhost:8000`

## 4) Kiểm tra healthcheck

```bash
npm run health:check
```

Kết quả mong đợi:
- API: `{"status":"ok"}`
- AI service: `{"status":"ok"}`

## 5) Lệnh thường dùng

```bash
npm run typecheck      # check TypeScript toàn monorepo
npm run build          # build workspace có script build
npm run lint           # lint workspace có script lint
npm run health:check   # check API + AI health endpoints
npm run setup          # check prereqs + bootstrap env local
npm run dev:infra:down # tắt docker compose
```

## 6) Cấu trúc chính

```text
apps/
	web/         # Next.js App Router
	api/         # NestJS backend
	ai-service/  # FastAPI + gRPC service
packages/
	shared/      # shared types/schemas/events
	ui/          # shared UI package
	config-ts/   # shared tsconfig presets
	config-eslint/ # shared lint config
```

## 7) Ghi chú thư viện

Danh sách thư viện đã cài và mục đích của từng thư viện xem tại:
- [DEPENDENCIES.md](DEPENDENCIES.md)
