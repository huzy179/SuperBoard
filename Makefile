# SuperBoard development Makefile
# Usage: make <target>
# All targets are equivalent to the npm scripts — the Makefile is purely a convenience alias.

.PHONY: dev dev-infra dev-infra-down db-migrate db-reset db-seed typecheck lint test setup health

dev: ## Start all apps in parallel (web + api + ai-service)
	npm run dev

dev-infra: ## Start Docker infrastructure (postgres, redis, minio, keycloak, mailhog, elasticsearch)
	npm run dev:infra

dev-infra-down: ## Stop Docker infrastructure
	npm run dev:infra:down

db-migrate: ## Run pending Prisma migrations
	npm run db:migrate

db-reset: ## Reset DB, re-run migrations and seed
	npm run db:reset

db-seed: ## Seed development data only
	npm run db:seed

typecheck: ## TypeScript type checking across monorepo
	npm run typecheck

lint: ## ESLint across monorepo
	npm run lint

test: ## Run all tests across monorepo
	npm run test

setup: ## Bootstrap local environment (check prereqs + create .env.local files)
	npm run setup

health: ## Check API and AI service health endpoints
	npm run health:check

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*## ' Makefile | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
