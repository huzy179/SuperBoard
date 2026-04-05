# System Architecture & Development Guide

This document provides a comprehensive overview of the SuperBoard architecture, tech stack, and development conventions.

---

## 🏗 Pattern Overview

SuperBoard is a **multi-app monorepo** with layered service boundaries.

- **Monorepo**: Managed by **Turborepo** for orchestration (`package.json`, `turbo.json`).
- **API**: Modular **NestJS** application (`apps/api/src/modules/*`).
- **Web**: **Next.js** App Router with route groups (`apps/web/app/`).
- **AI Service**: **FastAPI** service for AI-powered features (`apps/ai-service/`).
- **Shared Contract**: **@superboard/shared** package for DTOs and types.

---

## 🛠 Tech Stack

### Backend (API)

- **Framework**: NestJS (v11+)
- **ORM**: Prisma (v7+)
- **Database**: PostgreSQL
- **Caching/Queue**: Redis (BullMQ via NestJS modules)
- **Authentication**: JWT with `BearerAuthGuard`
- **Logging**: Pino with correlation ID propagation

### Frontend (Web)

- **Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS (Flexbox/Grid), TailwindCSS (where requested)
- **Data Fetching**: React Query (TanStack Query v5+)
- **Forms**: React Hook Form
- **State Management**: URL state (searchParams) + Context API for session/global UI.

### AI Service

- **Framework**: FastAPI (Python)
- **Task Management**: Celery (optional)
- **Storage**: Vector DB placeholders/mock for semantic search.

---

## 📂 Directory Structure

```text
.
├── apps/
│   ├── api/                # NestJS backend
│   ├── web/                # Next.js frontend
│   └── ai-service/         # Python AI services
├── packages/
│   ├── shared/             # Shared TypeScript types & DTOs
└── docker/                 # Infrastructure configuration (PostgreSQL, Redis, MailHog)
```

---

## 📝 Development Conventions

### Code Style & Linting

- **Prettier**: Enforced via `.prettierrc`.
- **ESLint**: Integrated with Next.js and NestJS.
- **Husky**: Pre-commit hooks for linting and formatting.

### API Standards

- **Global Prefix**: `/api/v1`
- **Error Handling**: Standardized via `http-exception.filter.ts`.
- **Response Envelope**: All responses use the `ApiResponse<T>` wrapper.
- **Correlation IDs**: Tracked across logs for request observability.

### Frontend Components

- **Atomic Components**: Reusable UI parts in `apps/web/components/ui/`.
- **Domain Components**: Feature-specific UI in `apps/web/components/[feature]/`.
- **Service Layer**: API calls abstracted into `apps/web/lib/services/`.

---

## 🧪 Testing Strategy

- **Unit Tests**: Vitest/Jest for services and utility functions.
- **Integration Tests**: Prisma transactions used for atomic lifecycle testing.
- **CI/CD**: Sequential checks (`lint` → `typecheck` → `test`) via GitHub Actions.

---

_Last updated: 2026-04-06_
