# Technical Stack Rationale

This document provides a detailed explanation of the SuperBoard technology stack and why each component was chosen for a production-grade SaaS workspace (Jira + Slack + Notion + AI).

## 🚀 Overview

The SuperBoard stack is built for **performance, scalability, and modern Developer Experience (DX)**. We prioritize modularity (NestJS), real-time capabilities (Redis/Socket.io), and AI-readiness (PostgreSQL/Python).

## 🛠️ Components & Rationale

### 1. Frontend: Next.js 14 (App Router) & React Query

- **Rationale**: To deliver the smooth, responsive experience of a desktop-class application (like Jira or Slack).
- **Key Features**:
  - **Server-Side Rendering (SSR) & Streaming**: Fast initial page loads and SEO optimization.
  - **React Query (TanStack)**: Advanced caching and **Optimistic UI** (updating the interface before the server confirms), which is critical for a "snappy" task management feel.

### 2. Backend API: NestJS (Modular Architecture)

- **Rationale**: Node.js is great for speed, but large projects need structure. NestJS provides an **enterprise-grade architecture** with Dependency Injection and clear separation of concerns.
- **Key Features**:
  - **Modularity**: Allows us to scale Pillars (Jira, Slack, Notion) as independent modules.
  - **Typed Middleware/Guards**: Consistent security and validation across all API endpoints.

### 3. Database: PostgreSQL & Prisma (ORM)

- **Rationale**: Data integrity is paramount for a workspace. PostgreSQL is the industry standard for ACID-compliant relational data.
- **Key Features**:
  - **Prisma**: Provides **end-to-end type safety**. Changes in the database are instantly reflected in TypeScript types for both Backend and Frontend.
  - **JSONB Support**: Allows flexible storage for things like AI results or TipTap editor content.
  - **pgvector**: Enables semantic search (vector search) for AI-powered features.

### 4. Real-time: Redis & Socket.io

- **Rationale**: Collaborative tools require instant updates. Redis acts as a high-speed message broker.
- **Key Features**:
  - **Pub/Sub**: Synchronizes real-time events across multiple backend instances.
  - **Caching**: Drastically reduces database load for frequently accessed data (like user permissions).

### 5. Identity & Access: Keycloak (IAM)

- **Rationale**: Security should not be "home-grown." Keycloak is a world-class, open-source Identity and Access Management solution.
- **Key Features**:
  - **SSO & OAuth2/OIDC**: Professional-grade login with Google/Github or enterprise LDHAP.
  - **RBAC**: Robust Role-Based Access Control out of the box.

### 6. AI Service: Python FastAPI & gRPC

- **Rationale**: The AI/LLM ecosystem is best in Python. FastAPI is the fastest way to serve AI models, and gRPC provides high-performance internal communication.
- **Key Features**:
  - **gRPC (HTTP/2)**: Allows NestJS (Node.js) to call the AI Service (Python) with minimal latency compared to traditional REST.

### 7. Monorepo: Turborepo

- **Rationale**: Managing multiple apps (Web, API, AI-Service) and shared packages (DTOs, Utils) is complex. Turborepo makes it simple and fast.
- **Key Features**:
  - **Shared Types**: `@superboard/shared` ensures the Frontend and Backend are always in sync.
  - **Efficient Builds**: Intelligent caching speeds up CI/CD pipelines.

---

## 🎯 Architecture Goals

- **Productivity**: High-speed DX with TypeScript and Prisma.
- **Scalability**: Stateless backend services and horizontal scaling via Redis.
- **Reliability**: Strong data integrity and standardized error handling.
