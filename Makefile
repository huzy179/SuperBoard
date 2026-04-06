# SuperBoard development Makefile
# Usage: make <target>
#
# Quick start:
#   make up        → start postgres + migrate + seed + dev servers
#   make fresh     → reset DB hoàn toàn + seed lại
#   make dev       → start dev servers (web + api)

.PHONY: dev dev-infra dev-infra-full dev-infra-down \
	db-generate db-migrate db-deploy db-seed db-fresh db-reset db-status db-studio \
        typecheck lint test setup health up help \
        monitoring-up monitoring-down

# ─── Dev servers ───────────────────────────────────────────

dev: ## Start all apps in parallel (web + api)
	npm run dev

up: dev-infra db-deploy db-seed dev ## Start infra + apply migrations + seed + dev servers

# ─── Docker infrastructure ─────────────────────────────────

dev-infra: ## Start minimal infra (postgres + redis — all Jira MVP needs)
	npm run dev:infra

dev-infra-full: ## Start full infra (includes unused: keycloak, elasticsearch, minio, mailhog, ai-service)
	npm run dev:infra:full

dev-infra-down: ## Stop all Docker services
	npm run dev:infra:down

monitoring-up: ## Start Promenade + Grafana
	docker compose -f docker/docker-compose.monitoring.yml up -d

monitoring-down: ## Stop Promenade + Grafana
	docker compose -f docker/docker-compose.monitoring.yml down

# ─── Database ──────────────────────────────────────────────

db-generate: ## Regenerate Prisma client after schema changes
	npm run db:generate

db-status: ## Show migration status (pending/applied)
	npm run db:status

db-migrate: ## Create + apply migration (interactive, dev only)
	npm run db:migrate

db-deploy: ## Apply pending migrations (non-interactive, CI/prod)
	npm run db:deploy

db-seed: ## Seed development data
	npm run db:seed

db-fresh: ## Reset DB + apply all migrations + seed (one command)
	npm run db:fresh

db-reset: ## Reset via prisma migrate reset + seed
	npm run db:reset

db-studio: ## Open Prisma Studio (DB browser)
	npm run db:studio

# ─── Quality ───────────────────────────────────────────────

typecheck: ## TypeScript type checking across monorepo
	npm run typecheck

lint: ## ESLint across monorepo
	npm run lint

test: ## Run all tests
	npm run test

# ─── Setup ─────────────────────────────────────────────────

setup: ## Bootstrap local environment (prereqs + .env.local files)
	npm run setup

health: ## Check API and AI service health endpoints
	npm run health:check

# ─── Help ──────────────────────────────────────────────────

help: ## Show this help message
	@echo ""
	@echo "  SuperBoard — available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*## ' Makefile | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  Common workflows:"
	@echo "    make up          Start everything from scratch"
	@echo "    make db-fresh    Reset DB + seed (khi schema thay đổi)"
	@echo "    make db-migrate  Tạo + apply migration mới khi đổi schema"
	@echo "    make db-seed     Chỉ seed lại data"
	@echo ""
