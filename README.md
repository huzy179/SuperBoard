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

```bash
# 1. Start infrastructure tối thiểu (postgres)
npm run dev:infra

# 2. Trong terminal khác, chạy đồng thời web + api + ai-service
npm run dev
```

Khi cần đầy đủ infrastructure services, chạy:

```bash
npm run dev:infra:full
```

**Infrastructure services:**

- **Postgres** (port 5433) - Main database
- **Mặc định khi chạy `dev:infra`: chỉ bật Postgres**
- **Tuỳ chọn khi chạy `dev:infra:full`:** Redis, Elasticsearch, MinIO, Keycloak, MailHog

**Application services (npm run dev):**

- **Web** - Next.js tại `http://localhost:3000`
- **API** - NestJS tại `http://localhost:4000`
- **AI Service** - FastAPI health endpoint tại `http://localhost:8000/health`

Lưu ý: PostgreSQL map ra port `5433` để tránh trùng với Postgres local.
Keycloak dùng database riêng `keycloak` (tách khỏi `superboard`) để tránh drift khi chạy Prisma migrate.

## 4) Kiểm tra healthcheck

```bash
npm run health:check
```

Kết quả mong đợi:

- **API** (`http://localhost:4000/api/v1/health`) - Chi tiết health DB, Redis, queue
- **AI Service** (`http://localhost:8000/health`) - Service health status

## 5) Lệnh thường dùng

### Development

```bash
npm run dev           # Chạy web + api + ai-service song song
npm run dev:infra    # Start infrastructure containers (postgres only)
npm run dev:infra:full # Start full infrastructure containers
npm run dev:infra:down  # Stop Docker containers
```

### Database

```bash
npm run db:reset     # Reset DB: drop + sync schema + seed data
npm run db:seed      # Seed development data
npm run db:migrate   # Create/run Prisma migrations
```

### Code Quality

```bash
npm run typecheck    # Check TypeScript toàn monorepo
npm run lint         # ESLint toàn monorepo
npm run build        # Build tất cả workspace có script build
npm run test         # Run tests
npm run format       # Format code với Prettier
```

### Setup & Health

```bash
npm run setup        # Check prerequisites + bootstrap .env.local
npm run health:check # Verify API + AI service health
```

### Commands via Makefile (convenience aliases)

```bash
make dev             # npm run dev
make dev-infra       # npm run dev:infra
make dev-infra-full  # npm run dev:infra:full
make dev-infra-down  # npm run dev:infra:down
make db-reset        # npm run db:reset
make db-seed         # npm run db:seed
make typecheck       # npm run typecheck
make lint            # npm run lint
make setup           # npm run setup
make health          # npm run health:check
```

### Quy trình local ngắn (khuyến nghị)

```bash
npm run setup
npm run dev:infra
npm run dev
npm run health:check
```

Nếu cần reset dữ liệu trước khi code:

```bash
npm run db:reset
```

## 6) Cấu trúc dự án

```text
apps/
  api/         # NestJS REST API
  web/         # Next.js frontend (App Router)
  ai-service/  # Python gRPC service

packages/
  shared/      # Shared types, schemas, events
  ui/          # Shared UI components (planned)
  config-ts/   # Shared TypeScript config presets
  config-eslint/ # Shared ESLint rules

docker/
  Dockerfile.api    # API container
  Dockerfile.web    # Web container
  Dockerfile.ai     # AI service container
  docker-compose.yml # Infrastructure + services orchestration
  README.md         # Docker detailed docs

scripts/
  setup.mjs    # Initial project setup
  db-reset.mjs # Database reset automation
  health-check.mjs # Health check script

worklog/
  PROJECT_STRUCTURE.md # Detailed folder documentation
  todo.md              # Tasks to do (P0, P1, Backlog)
  doing.md             # Work in progress
  done.md              # Completed items
```

**Để hiểu chi tiết từng folder và file quan trọng:**

- 📖 Xem [worklog/PROJECT_STRUCTURE.md](worklog/PROJECT_STRUCTURE.md)
- 🐳 Xem [docker/README.md](docker/README.md) để hiểu Docker setup

## 7) Ghi chú thư viện

Danh sách thư viện đã cài và mục đích của từng thư viện xem tại:

- 📋 [ambition/DEPENDENCIES.md](ambition/DEPENDENCIES.md)

## 8) Environment Variables

Khi chạy `npm run setup`, project tự động tạo `.env.local` cho từng app:

- `apps/api/.env.local`
- `apps/web/.env.local`
- `apps/ai-service/.env.local`

Nếu cần custom:

**Các biến quan trọng:**

API (apps/api):

```
DATABASE_URL=postgresql://dev:devpassword@localhost:5433/superboard
REDIS_URL=redis://localhost:6379
KEYCLOAK_URL=http://localhost:8080
```

Web (apps/web):

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

AI Service (apps/ai-service):

```
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379
```

## 9) Database Management

### Reset hoàn toàn database

```bash
npm run db:reset
```

Thực hiện: drop DB → create DB → apply migrations → seed data

### Tạo migration mới

```bash
# Sau khi sửa schema.prisma
npm --workspace @superboard/api run prisma migrate dev --name "my_feature"
```

### Seed dữ liệu development

```bash
npm run db:seed
```

## 10) Docker Management

### View logs

```bash
# Tất cả services
docker compose -f docker/docker-compose.yml logs -f

# Service cụ thể
docker compose -f docker/docker-compose.yml logs -f postgres
docker compose -f docker/docker-compose.yml logs -f api
```

### Check status

```bash
docker compose -f docker/docker-compose.yml ps
```

### Rebuild services

```bash
docker compose -f docker/docker-compose.yml build
```

Xem chi tiết: [docker/README.md](docker/README.md)

## 11) Troubleshooting

### Port đã được dùng

```bash
# Tìm process dùng port
lsof -i :3000     # macOS/Linux
netstat -ano | findstr :3000  # Windows PowerShell
```

### Database connection error

```bash
# Kiểm tra postgres trong Docker
docker compose -f docker/docker-compose.yml exec postgres psql -U dev -d superboard

# Reset database
npm run db:reset
```

### AI service gRPC connection

```bash
# Check health
npm run health:check

# View logs
docker compose -f docker/docker-compose.yml logs ai-service
```

### "Module not found" từ @superboard/shared

```bash
# Reinstall dependencies
npm install

# Hoặc rebuild shared package
npm --workspace @superboard/shared run build
```

## 12) Tech Stack Overview

| Layer              | Technology                                                     |
| ------------------ | -------------------------------------------------------------- |
| **Frontend**       | Next.js 14 (App Router), TypeScript, React Query, Tailwind CSS |
| **Backend**        | NestJS, Prisma ORM, PostgreSQL, Redis, Socket.io               |
| **AI/ML**          | Python 3.11+, gRPC, Elasticsearch                              |
| **Auth**           | Keycloak                                                       |
| **Storage**        | MinIO (S3-compatible)                                          |
| **Infrastructure** | Docker, Docker Compose                                         |
| **Monorepo**       | Turborepo                                                      |
| **Code Quality**   | ESLint, Prettier, TypeScript strict                            |

## 13) Useful Resources

- 📖 [SuperBoard Master Plan](ambition/superboard-master-plan.md) - Vision & roadmap
- 📁 [Project Structure Detail](worklog/PROJECT_STRUCTURE.md) - Chi tiết folders & files
- 🚀 [Worklog Progress](worklog/) - todo.md, doing.md, done.md
- 🐳 [Docker Setup](docker/README.md) - Docker detailed documentation
