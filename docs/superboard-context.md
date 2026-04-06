# SuperBoard — Toàn Bộ Context & Lộ Trình Chi Tiết (v2)

> **Mục đích file này:** Lưu toàn bộ context dự án để không mất thông tin giữa các cuộc hội thoại.
> Đây là dự án học tập fullstack toàn diện, không phải tutorial — code thật, deploy thật.

---

## Tổng Quan Dự Án

**Tên:** SuperBoard  
**Mô tả:** Nền tảng quản lý dự án real-time, collaborative — tương tự Jira + Notion + Slack gộp lại  
**Mục tiêu học tập:** Rèn luyện TẤT CẢ kỹ thuật fullstack production-grade trong 1 project thực tế  
**Timeline ước tính:** 20–24 tuần (học part-time ~10–15h/tuần)  
**Nguyên tắc:** Không làm tutorial giả. Mỗi pha có deliverable cụ thể. Hiểu sâu hơn làm nhanh.

---

## Stack Công Nghệ Đã Chốt

### Frontend

| Công nghệ              | Version | Mục đích                                |
| ---------------------- | ------- | --------------------------------------- |
| Next.js                | 14+     | App Router, SSR, RSC, Streaming         |
| TypeScript             | 5.4+    | Strict mode, shared types               |
| React Query (TanStack) | 5+      | Client cache, optimistic updates        |
| Zustand                | 4+      | Global UI state (thay vì Redux)         |
| Tailwind CSS           | 3+      | Styling                                 |
| Socket.io client       | 4+      | Real-time UI                            |
| PWA (Service Worker)   | —       | Offline, installable, push notification |

### Backend

| Công nghệ              | Version | Mục đích                                    |
| ---------------------- | ------- | ------------------------------------------- |
| NestJS                 | 10+     | Main API framework (thay Fastify đơn thuần) |
| TypeScript             | 5.4+    | Strict mode                                 |
| Prisma                 | 5+      | ORM, migrations, type-safe queries          |
| Apollo Server (NestJS) | —       | GraphQL endpoint                            |
| Socket.io server       | 4+      | WebSocket với Redis Adapter                 |
| Pino                   | —       | Structured JSON logging                     |

### AI Service (tách riêng)

| Công nghệ           | Version | Mục đích                              |
| ------------------- | ------- | ------------------------------------- |
| Python              | 3.12+   | AI/ML service                         |
| FastAPI             | —       | HTTP + gRPC server                    |
| gRPC + protobuf     | —       | Communication với NestJS              |
| OpenAI / Gemini API | —       | LLM cho summarization, chatbot        |
| pgvector            | —       | Vector embeddings cho semantic search |

### Infrastructure

| Công nghệ     | Mục đích                                            |
| ------------- | --------------------------------------------------- |
| PostgreSQL 16 | Primary relational database                         |
| Redis 7       | Cache, Session, Pub/Sub, Rate limiting, BullMQ      |
| MinIO         | Object storage (S3-compatible, dev) → AWS S3 (prod) |
| Keycloak      | Identity Provider, SSO, OAuth2/OIDC, RBAC           |
| Elasticsearch | Full-text search                                    |
| ClickHouse    | OLAP analytics (MAU, DAU, aggregations)             |
| Kafka         | Event streaming (phase microservices)               |
| BullMQ        | Job queue (email, notifications, AI jobs)           |
| Nginx         | API Gateway, SSL termination, rate limit            |

### DevOps

| Công nghệ              | Mục đích                          |
| ---------------------- | --------------------------------- |
| Turborepo              | Monorepo management               |
| Docker + Compose       | Containerization, dev environment |
| Kubernetes             | Orchestration (prod)              |
| GitHub Actions         | CI/CD pipeline                    |
| Prometheus + Grafana   | Metrics, dashboards, alerting     |
| OpenTelemetry + Jaeger | Distributed tracing               |
| Sentry                 | Error tracking FE + BE            |
| k6                     | Load testing                      |

---

## Cấu Trúc Monorepo

```
superboard/
├── apps/
│   ├── web/                    ← Next.js 14 (App Router)
│   │   ├── app/                ← Route segments
│   │   ├── components/
│   │   ├── stores/             ← Zustand stores
│   │   ├── hooks/              ← React Query hooks
│   │   └── public/sw.js        ← Service Worker
│   ├── api/                    ← NestJS backend
│   │   ├── src/
│   │   │   ├── modules/        ← Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── workspace/
│   │   │   │   ├── project/
│   │   │   │   ├── task/
│   │   │   │   ├── notification/
│   │   │   │   └── upload/
│   │   │   ├── common/         ← Guards, Interceptors, Filters
│   │   │   ├── config/         ← Environment config
│   │   │   └── prisma/         ← Prisma service
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   └── ai-service/             ← Python FastAPI
│       ├── main.py
│       ├── grpc_server.py
│       ├── services/
│       │   ├── summarize.py
│       │   ├── semantic_search.py
│       │   └── chatbot.py
│       └── proto/
│           └── ai_service.proto
├── packages/
│   ├── shared/                 ← Types dùng chung FE + BE
│   │   └── src/
│   │       ├── types/          ← Domain types (User, Task, Project...)
│   │       ├── schemas/        ← Zod validation schemas
│   │       └── events/         ← WebSocket event types
│   ├── ui/                     ← Shared React component library
│   ├── config-ts/              ← Shared tsconfig
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   └── node.json
│   └── config-eslint/         ← Shared ESLint rules
├── turbo.json
├── package.json                ← Root workspace config
├── docker-compose.yml          ← Full dev environment
└── .env.example
```

---

## Docker Compose — Dev Environment

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    ports: ['5432:5432']
    environment:
      POSTGRES_DB: superboard
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U dev']
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio
    ports: ['9000:9000', '9001:9001'] # 9001 = console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    ports: ['8080:8080']
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/superboard
      KC_DB_USERNAME: dev
      KC_DB_PASSWORD: devpassword
    command: start-dev
    depends_on:
      postgres:
        condition: service_healthy

  mailhog:
    image: mailhog/mailhog
    ports: ['1025:1025', '8025:8025'] # 8025 = web UI

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    ports: ['9200:9200']
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - 'ES_JAVA_OPTS=-Xms512m -Xmx512m'
    volumes:
      - es_data:/usr/share/elasticsearch/data

  clickhouse:
    image: clickhouse/clickhouse-server:24.3
    ports: ['8123:8123', '9000:9000']
    volumes:
      - ch_data:/var/lib/clickhouse

volumes:
  postgres_data:
  redis_data:
  minio_data:
  es_data:
  ch_data:
```

**Cách dùng:**

```bash
docker compose up -d          # Start tất cả
docker compose ps             # Kiểm tra status
docker compose logs -f api    # Xem logs service cụ thể
docker compose down -v        # Xóa hoàn toàn (kể cả volumes)
```

**URLs local:**

- Keycloak Admin: http://localhost:8080
- MinIO Console: http://localhost:9001
- MailHog UI: http://localhost:8025
- Elasticsearch: http://localhost:9200
- ClickHouse HTTP: http://localhost:8123

---

## Shared Types — packages/shared

```typescript
// packages/shared/src/types/index.ts

// === DOMAIN TYPES ===
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string; // ISO string — JSON-safe
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  storageUsed: number; // bytes
  storageQuota: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User | null;
  projectId: string;
  parentId: string | null; // subtasks
  dueDate: string | null;
  tags: string[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  taskId: string;
}

// === API CONTRACT ===
export type ApiResponse<T> =
  | { success: true; data: T; meta?: PaginationMeta }
  | { success: false; error: ApiError };

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

export interface ApiError {
  code: string; // e.g. "TASK_NOT_FOUND", "PERMISSION_DENIED"
  message: string;
  details?: Record<string, string[]>; // validation errors
}

// === WEBSOCKET EVENTS ===
export interface ServerToClientEvents {
  'task:created': (p: Task) => void;
  'task:updated': (p: Task) => void;
  'task:deleted': (p: { id: string }) => void;
  'user:presence': (p: { userId: string; status: 'online' | 'offline' }) => void;
  notification: (p: Notification) => void;
  'comment:added': (p: Comment) => void;
}

export interface ClientToServerEvents {
  'join:workspace': (workspaceId: string) => void;
  'join:project': (projectId: string) => void;
  'leave:project': (projectId: string) => void;
  'cursor:move': (p: { x: number; y: number; taskId?: string }) => void;
}
```

---

## Prisma Schema — Thiết Kế Database

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  avatarUrl      String?
  keycloakId     String   @unique  // Link với Keycloak user
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  workspaceMembers WorkspaceMember[]
  assignedTasks    Task[]            @relation("AssignedTasks")
  createdTasks     Task[]            @relation("CreatedTasks")
  comments         Comment[]
  auditLogs        AuditLog[]

  @@map("users")
}

model Workspace {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  logoUrl      String?
  plan         Plan     @default(FREE)
  storageUsed  BigInt   @default(0)
  storageQuota BigInt   @default(5368709120) // 5GB
  createdAt    DateTime @default(now())

  members  WorkspaceMember[]
  projects Project[]

  @@map("workspaces")
}

model WorkspaceMember {
  id          String    @id @default(cuid())
  userId      String
  workspaceId String
  role        UserRole  @default(MEMBER)
  joinedAt    DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@map("workspace_members")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  color       String   @default("#6366f1")
  isArchived  Boolean  @default(false)
  workspaceId String
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  tasks     Task[]

  @@index([workspaceId])  // CRITICAL — filter by workspace thường xuyên
  @@map("projects")
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  position    Float        @default(0) // Cho drag-and-drop ordering
  projectId   String
  assigneeId  String?
  creatorId   String
  parentId    String?      // Subtasks
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?        @relation("AssignedTasks", fields: [assigneeId], references: [id])
  creator     User         @relation("CreatedTasks", fields: [creatorId], references: [id])
  parent      Task?        @relation("SubTasks", fields: [parentId], references: [id])
  subtasks    Task[]       @relation("SubTasks")
  comments    Comment[]
  attachments Attachment[]
  tags        TaskTag[]
  events      TaskEvent[]  // Event sourcing

  @@index([projectId, status])   // Filter tasks by project + status
  @@index([assigneeId])
  @@index([dueDate])
  @@map("tasks")
}

model TaskEvent {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  event     String   // "status_changed", "assigned", "priority_changed"...
  payload   Json     // { from: "todo", to: "in_progress" }
  createdAt DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("task_events")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  taskId    String
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id])

  @@index([taskId])
  @@map("comments")
}

model Attachment {
  id        String   @id @default(cuid())
  name      String
  key       String   // MinIO/S3 object key
  url       String   // Public or presigned URL
  size      BigInt
  mimeType  String
  taskId    String
  uploadedAt DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@map("attachments")
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String   // "auth.login", "task.delete", "workspace.update"
  resource   String   // "task", "project", "workspace"
  resourceId String?
  ipAddress  String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
  @@index([action])
  @@map("audit_logs")
}

model Tag {
  id          String    @id @default(cuid())
  name        String
  color       String
  workspaceId String
  tasks       TaskTag[]

  @@unique([name, workspaceId])
  @@map("tags")
}

model TaskTag {
  taskId String
  tagId  String

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
  @@map("task_tags")
}

enum UserRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}
```

---

## 10 Pha Học — Chi Tiết Đầy Đủ

---

### Pha 1 — Foundation & Monorepo (1–2 tuần)

**Mục tiêu:** Setup nền móng không thay đổi trong suốt project. Làm đúng một lần.

**Các bước cụ thể:**

1. `npx create-turbo@latest superboard` → khởi tạo monorepo
2. Xóa apps mẫu, tạo lại `apps/web` (Next.js), `apps/api` (NestJS), `apps/ai-service` (Python)
3. Tạo `packages/shared`, `packages/ui`, `packages/config-ts`, `packages/config-eslint`
4. Cấu hình `turbo.json` pipeline: `build` depends on `^build`, `dev` persistent + no-cache
5. Setup `tsconfig` base → nextjs → node, strict mode bật hết
6. `docker compose up -d` → verify tất cả containers healthy
7. Viết `packages/shared/src/types/index.ts` — domain types đầu tiên
8. Test: `npm run dev` ở root → cả web + api chạy song song

**Checklist deliverable:**

- [ ] `npm run dev` → web:3000, api:4000 đều start
- [ ] `docker compose ps` → postgres, redis, minio, mailhog, keycloak đều healthy
- [ ] `curl localhost:4000/api/v1/health` → JSON `{ status: "ok" }`
- [ ] `npm run build` → 0 TypeScript errors
- [ ] Import `{ Task }` từ `@superboard/shared` trong cả web lẫn api không lỗi

**Lý do chọn Turborepo:** Cache build artifacts, chạy parallel tasks, chia sẻ packages dễ dàng.

---

### Pha 2 — Auth & IAM — Keycloak (2–3 tuần)

**Mục tiêu:** Xây dựng hệ thống xác thực và phân quyền chuẩn enterprise. Không tự code auth từ đầu.

**Tại sao Keycloak thay vì tự làm:**

- Keycloak xử lý: SSO, OAuth2, OIDC, SAML, LDAP federation, TOTP, password policy, brute-force protection
- Tự làm JWT + OAuth từ đầu: mất 2–3 tuần, dễ có security bug
- Học được: cách tích hợp external Identity Provider vào NestJS — kỹ năng thực tế cao

**Flow đăng nhập hoàn chỉnh:**

```
Browser → Next.js /login
       → Redirect đến Keycloak Authorization Endpoint
       → User nhập email/password (+ TOTP nếu bật)
       → Keycloak redirect về /api/auth/callback?code=xxx
       → NestJS exchange code → access_token + refresh_token
       → Lưu refresh_token vào HTTP-only cookie
       → Lưu access_token vào Keycloak session (hoặc memory ngắn hạn)
       → Redirect về dashboard
```

**Keycloak config cần setup:**

```
Realm: superboard
Client ID: superboard-app
Client Type: confidential (có client secret)
Valid Redirect URIs: http://localhost:3000/api/auth/callback
Roles: workspace-owner, workspace-admin, workspace-member, workspace-viewer
```

**NestJS Guards:**

```typescript
// apps/api/src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Validate JWT signature bằng Keycloak public key (JWKS endpoint)
  // Inject user info vào request.user
}

// apps/api/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    // Check user có role cần thiết trong workspace hiện tại không
  }
}
```

**Redis session store:**

```
Key pattern: session:{userId}
Value: { workspaceId, role, permissions, lastActive }
TTL: 7 days (refresh mỗi khi active)
Invalidation: khi logout, khi role bị thay đổi bởi admin
```

**Rate limiting — Sliding window với Redis:**

```
Key: rate_limit:{userId}:{window_start}
Value: request count
TTL: 15 minutes
Limit: 100 requests / 15 min
→ Trả 429 Too Many Requests khi vượt
```

**Checklist deliverable:**

- [ ] Login qua Keycloak → nhận JWT, redirect về dashboard
- [ ] OAuth Google/GitHub qua Keycloak (configure Social Identity Provider)
- [ ] RBAC guard: VIEWER không thể tạo task (403)
- [ ] HTTP-only cookie set đúng: Secure, SameSite=Strict
- [ ] Silent token renewal: axios interceptor tự refresh khi 401
- [ ] Rate limit: gọi API >100 lần/15min → nhận 429
- [ ] Audit log: mọi login/logout ghi vào bảng `audit_logs`
- [ ] MFA: enable TOTP trong Keycloak, test login với authenticator app

---

### Pha 3 — Core Backend — NestJS (2–3 tuần)

**Mục tiêu:** Xây dựng toàn bộ business logic, API, và database layer.

**Tại sao NestJS thay vì Fastify đơn thuần:**

- NestJS có module system, DI container, Guards/Interceptors/Pipes/Filters built-in
- Tích hợp tốt với Keycloak (Guards), logging (Interceptors), validation (Pipes)
- Fastify vẫn có thể dùng làm HTTP engine bên dưới NestJS

**NestJS Module Structure:**

```
src/
├── app.module.ts               ← Root module
├── config/                     ← ConfigModule, typed env
├── prisma/                     ← PrismaService (singleton)
├── common/
│   ├── guards/                 ← JwtAuthGuard, RolesGuard
│   ├── interceptors/           ← LoggingInterceptor, TransformInterceptor
│   ├── filters/                ← GlobalExceptionFilter
│   ├── pipes/                  ← ZodValidationPipe
│   └── decorators/             ← @CurrentUser(), @Roles()
└── modules/
    ├── auth/
    ├── workspace/
    ├── project/
    ├── task/
    ├── comment/
    ├── notification/
    ├── upload/
    └── search/
```

**Logging Interceptor — ghi mọi request:**

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const correlationId = req.headers['x-correlation-id'] ?? randomUUID();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        logger.info({
          correlationId,
          method: req.method,
          url: req.url,
          userId: req.user?.id,
          duration: Date.now() - start,
          statusCode: context.switchToHttp().getResponse().statusCode,
        });
      }),
    );
  }
}
```

**Global Exception Filter:**

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Map mọi loại lỗi → ApiResponse<never> chuẩn
    // PrismaClientKnownRequestError → 404 hoặc 409
    // ZodError → 400 với field-level errors
    // UnauthorizedException → 401
    // ForbiddenException → 403
  }
}
```

**GraphQL setup (schema-first với code-first approach):**

```typescript
// Dùng cho các màn hình cần dữ liệu lồng nhau (dashboard, task detail)
// REST API vẫn là primary — GraphQL là thêm vào
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true, // Code-first: generate schema từ decorators
  context: ({ req }) => ({ req }),
});
```

**DataLoader để tránh N+1:**

```typescript
// Khi load 100 tasks, mỗi task có assignee
// Không DataLoader: 100 queries SELECT user WHERE id = ?
// Có DataLoader: 1 query SELECT user WHERE id IN (...)
@Injectable()
class UserLoader {
  batchLoadUsers(userIds: string[]): Promise<User[]> {
    return this.prisma.user.findMany({ where: { id: { in: userIds } } });
  }
}
```

**Checklist deliverable:**

- [ ] CRUD Task/Project/Workspace đầy đủ
- [ ] GraphQL playground tại `/graphql`
- [ ] Swagger docs tự generate tại `/api/docs`
- [ ] Prisma migrations: `npx prisma migrate dev` chạy OK
- [ ] Query có index: `EXPLAIN ANALYZE` cho task list query <10ms
- [ ] LoggingInterceptor: mọi request có log với correlationId
- [ ] ZodValidationPipe: tạo task với title rỗng → 400 với field error rõ ràng

---

### Pha 4 — Frontend — Next.js + PWA (2 tuần)

**Mục tiêu:** Xây dựng UI production-grade với performance tốt và offline support.

**Render Strategy:**

```
/login, /landing, /blog   → SSR (SEO cần thiết, data từ server)
/dashboard/*              → Client-side (heavy interaction, no SEO needed)
/share/task/:id           → SSG (public share page, không thay đổi thường)
/api/og/*                 → Edge Runtime (OG image generation)
```

**Zustand stores:**

```typescript
// stores/ui.store.ts
interface UIState {
  activeWorkspaceId: string | null;
  sidebarOpen: boolean;
  selectedTaskId: string | null;
  // Actions
  setActiveWorkspace: (id: string) => void;
  openTaskDetail: (id: string) => void;
}

// stores/socket.store.ts
interface SocketState {
  socket: Socket | null;
  connected: boolean;
  init: (token: string) => void;
  disconnect: () => void;
}
```

**React Query patterns:**

```typescript
// Optimistic update khi move task
useMutation({
  mutationFn: (data: MoveTaskDto) => api.task.move(data),
  onMutate: async (data) => {
    // 1. Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['tasks', data.projectId] });
    // 2. Snapshot current data
    const previous = queryClient.getQueryData(['tasks', data.projectId]);
    // 3. Optimistically update
    queryClient.setQueryData(['tasks', data.projectId], (old) => /* update */);
    return { previous };
  },
  onError: (err, data, context) => {
    // Rollback nếu server thất bại
    queryClient.setQueryData(['tasks', data.projectId], context.previous);
  },
})
```

**PWA — Service Worker:**

```javascript
// public/sw.js
const CACHE_NAME = 'superboard-v1';
const STATIC_ASSETS = ['/', '/offline', '/_next/static/...'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)));
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    // API: network-first, fallback to cache
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    // Static: cache-first
    e.respondWith(caches.match(e.request).then((cached) => cached ?? fetch(e.request)));
  }
});
```

**Checklist deliverable:**

- [ ] Kanban board: drag-and-drop task giữa columns
- [ ] App installable: "Add to Home Screen" prompt xuất hiện
- [ ] Offline: tắt mạng → `/offline` page hiện ra, static assets vẫn load
- [ ] LCP <2.5s (đo bằng Lighthouse)
- [ ] Push notification: server gửi → browser nhận và hiện
- [ ] Optimistic update: kéo task → UI cập nhật ngay, không chờ server

---

### Pha 5 — Caching Đa Tầng (1–2 tuần)

**Mục tiêu:** Giảm latency và tải database bằng caching thông minh ở nhiều tầng.

**Cache Hierarchy:**

```
Request
  ↓
[1] Browser cache (Cache-Control: max-age=60)
  ↓ miss
[2] CDN Edge cache (Cloudflare, 5 min)
  ↓ miss
[3] Redis application cache (1–60 min tùy data)
  ↓ miss
[4] PostgreSQL (source of truth)
```

**Cache-aside pattern trong NestJS:**

```typescript
// Decorator để cache tự động
@UseInterceptors(RedisCacheInterceptor)
@CacheTTL(300) // 5 phút
async getWorkspaceProjects(workspaceId: string) {
  return this.projectRepository.findMany({ workspaceId });
}

// Cache key strategy
`workspace:${workspaceId}:projects`
`task:${taskId}`
`user:${userId}:permissions:${workspaceId}`
```

**Stampede prevention:**

```typescript
async getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Lấy distributed lock — tránh nhiều server cùng query DB
  const lockKey = `lock:${key}`;
  const locked = await redis.set(lockKey, '1', 'EX', 10, 'NX');
  if (!locked) {
    // Đợi 100ms rồi thử lại (lock holder đang fetch)
    await sleep(100);
    return this.getCachedOrFetch(key, fetcher, ttl);
  }

  try {
    const data = await fetcher();
    await redis.setex(key, ttl, JSON.stringify(data));
    return data;
  } finally {
    await redis.del(lockKey);
  }
}
```

**Cache invalidation patterns:**

```
Task updated → xóa cache key `task:{id}` và `project:{projectId}:tasks`
User role changed → xóa `user:{userId}:permissions:*`
Workspace deleted → pattern delete `workspace:{id}:*`
```

**Checklist deliverable:**

- [ ] API `/projects` lần đầu: 150ms, lần 2: <20ms (cache hit)
- [ ] Redis Monitor: thấy GET/SET commands đúng pattern
- [ ] Cache hit rate >85% (đo qua `redis INFO stats`)
- [ ] ETag hoạt động: 304 Not Modified khi data không đổi
- [ ] Stampede test: 100 concurrent requests đến cold cache → chỉ 1 DB query

---

### Pha 6 — Real-time & Message Queue (2 tuần)

**Mục tiêu:** Làm ứng dụng thực sự collaborative — nhiều user cùng làm việc thấy thay đổi tức thì.

**Socket.io với Redis Adapter — tại sao cần:**

```
Server Instance 1  ←→  Redis Pub/Sub  ←→  Server Instance 2
User A connects to Instance 1             User B connects to Instance 2
User A cập nhật task → Instance 1 publish event
Redis broadcast → Instance 2 nhận và forward đến User B
→ Cả hai thấy thay đổi tức thì dù kết nối khác server
```

**Room strategy:**

```
workspace:{id}  → tất cả members của workspace
project:{id}    → members đang xem project cụ thể
task:{id}       → user đang mở task detail (presence + cursor)
```

**BullMQ Queue design:**

```typescript
const queues = {
  email: new Queue('email'), // Gửi email (welcome, notification)
  notification: new Queue('notification'), // In-app notifications
  fileProcess: new Queue('file-process'), // Resize ảnh sau upload
  aiSummarize: new Queue('ai-summarize'), // Tóm tắt task bằng AI
  webhook: new Queue('webhook'), // Outbound webhooks
};

// Worker với retry và error handling
const emailWorker = new Worker(
  'email',
  async (job) => {
    await sendEmail(job.data);
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
);
```

**Event Sourcing cho task history:**

```
Mỗi thay đổi của task → INSERT vào bảng task_events
{ taskId, userId, event: "status_changed", payload: { from: "todo", to: "in_progress" } }

Để rebuild state: SELECT * FROM task_events WHERE taskId = ? ORDER BY createdAt
Để xem history: SELECT * FROM task_events WHERE taskId = ? (đã là audit trail hoàn chỉnh)
```

**Checklist deliverable:**

- [ ] Mở board trên 2 tab → kéo task ở tab 1 → tab 2 cập nhật <200ms
- [ ] Tắt email SMTP thật → BullMQ queue nhận job, MailHog hiện email
- [ ] Task history: thấy đầy đủ ai đã thay đổi gì và khi nào
- [ ] Presence: biết ai đang online trong workspace
- [ ] Webhook: cấu hình URL → POST request gửi đi khi task done
- [ ] BullMQ dashboard: thấy jobs, retry, failed jobs

---

### Pha 7 — File Storage & Media (1 tuần)

**Mục tiêu:** Xử lý upload/download file một cách professional — không lưu file trong DB, không qua server khi không cần.

**Presigned URL flow (quan trọng nhất):**

```
1. FE gọi POST /api/upload/presign  { filename, mimeType, size }
2. BE validate: size <50MB, mimeType cho phép, quota còn đủ
3. BE gọi MinIO tạo presigned PUT URL (expires: 5 phút)
4. BE trả về { uploadUrl, fileKey }
5. FE PUT file trực tiếp lên MinIO bằng uploadUrl
6. FE gọi POST /api/upload/confirm { fileKey }
7. BE verify file đã tồn tại trong MinIO, lưu Attachment vào DB
```

**Lý do dùng Presigned URL:**

- File không đi qua NestJS server → tiết kiệm băng thông và CPU
- NestJS server không cần handle file streaming
- Upload song song nhiều file không bottleneck

**Image processing pipeline:**

```
Upload ảnh → Queue job "file-process" → Sharp worker:
  - Compress: giảm quality 85%
  - Resize: tạo 3 variants: thumb(100x100), medium(400x400), original
  - Convert: .jpg/.png → .webp (50-70% nhỏ hơn)
  - Lưu cả 3 variants vào MinIO
  - Cập nhật Attachment record với URLs
```

**Storage quota:**

```
Per workspace: mặc định 5GB (FREE), 50GB (PRO)
Track: UPDATE workspaces SET storage_used = storage_used + fileSize WHERE id = ?
Enforce: trước khi tạo presigned URL, check storage_used + fileSize <= storage_quota
Cleanup: file bị xóa → cập nhật ngược lại storage_used
```

**Checklist deliverable:**

- [ ] Upload avatar: presigned URL flow hoạt động end-to-end
- [ ] Đính kèm file vào task: download link hoạt động
- [ ] Upload ảnh .png 2MB → MinIO có 3 variants .webp
- [ ] Vượt quota → 413 Payload Too Large với message rõ ràng
- [ ] Multipart: upload file 20MB không bị timeout

---

### Pha 8 — Python AI Service + gRPC (2–3 tuần)

**Mục tiêu:** Học gRPC và tích hợp AI thực tế vào project.

**Tại sao Python cho AI service:**

- Python ecosystem tốt hơn cho AI/ML (PyTorch, transformers, langchain)
- gRPC: binary protocol, nhanh hơn HTTP/JSON ~10x cho internal service calls
- Học được: inter-service communication, protobuf schema design

**Proto file:**

```protobuf
// apps/ai-service/proto/ai_service.proto
syntax = "proto3";

service AIService {
  rpc SummarizeTask (SummarizeRequest) returns (SummarizeResponse);
  rpc SearchSemantic (SearchRequest) returns (SearchResponse);
  rpc ChatWithWorkspace (stream ChatMessage) returns (stream ChatMessage);
}

message SummarizeRequest {
  string task_id = 1;
  string content = 2;
  string language = 3;  // "vi" or "en"
}

message SummarizeResponse {
  string summary = 1;
  repeated string key_points = 2;
  float confidence = 3;
}
```

**NestJS gRPC client:**

```typescript
// Trong TaskModule
@Client({
  transport: Transport.GRPC,
  options: {
    url: 'localhost:50051',
    package: 'ai',
    protoPath: join(__dirname, 'proto/ai_service.proto'),
  },
})
private aiClient: ClientGrpc;

async summarizeTask(taskId: string): Promise<string> {
  const task = await this.taskRepository.findById(taskId);
  const result = await this.aiService.SummarizeTask({
    task_id: taskId,
    content: task.description,
    language: 'vi',
  }).toPromise();
  return result.summary;
}
```

**AI features để implement:**

1. **Task summarization**: Gọi OpenAI/Gemini để tóm tắt description dài
2. **Semantic search**: Embed tasks → pgvector → tìm task tương tự
3. **RAG Chatbot**: Index workspace data, trả lời "task nào overdue?" "ai đang làm gì?"
4. **Auto-tagging**: Phân tích title/description → gợi ý tags phù hợp

**Async AI via BullMQ:**

```
User nhấn "Summarize" → POST /api/tasks/:id/summarize
NestJS add job vào BullMQ queue "ai-summarize"
Python worker pick up job → gọi OpenAI API (1–5 giây)
Python worker gửi kết quả về qua WebSocket event
UI cập nhật task với summary
→ Không block HTTP request, UX tốt hơn
```

**Checklist deliverable:**

- [ ] `grpc_server.py` chạy tại port 50051
- [ ] NestJS gọi gRPC thành công (test với grpcurl)
- [ ] Nút "Summarize" trên task → 3–5 giây → summary xuất hiện
- [ ] Tìm kiếm "fix bug login" → tìm ra tasks liên quan dù không match keyword
- [ ] Chatbot trả lời: "Có bao nhiêu task đang in_progress?" → số chính xác

---

### Pha 9 — Analytics — ClickHouse + Elasticsearch (2 tuần)

**Mục tiêu:** Thu thập và phân tích dữ liệu người dùng — từ search đến business metrics.

**Elasticsearch cho full-text search:**

```typescript
// Index task khi create/update
await esClient.index({
  index: 'tasks',
  id: task.id,
  body: {
    title: task.title,
    description: task.description,
    tags: task.tags,
    status: task.status,
    workspaceId: task.workspaceId,
    createdAt: task.createdAt,
  },
});

// Search với fuzzy + highlight
const result = await esClient.search({
  index: 'tasks',
  body: {
    query: {
      multi_match: {
        query: searchTerm,
        fields: ['title^3', 'description', 'tags'],
        fuzziness: 'AUTO',
      },
    },
    highlight: {
      fields: { title: {}, description: {} },
    },
  },
});
```

**ClickHouse cho analytics:**

```sql
-- Bảng events cho OLAP
CREATE TABLE user_events (
  event_time   DateTime,
  user_id      String,
  workspace_id String,
  event_type   String,  -- 'task_created', 'task_completed', 'login', etc.
  properties   String   -- JSON
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (workspace_id, event_time);

-- Query analytics nhanh
SELECT
  toDate(event_time) AS date,
  uniq(user_id) AS dau,
  countIf(event_type = 'task_completed') AS tasks_done
FROM user_events
WHERE workspace_id = ? AND event_time >= today() - 30
GROUP BY date
ORDER BY date;
```

**ETL Pipeline (BullMQ Cron):**

```
Mỗi đêm lúc 2:00 AM:
1. SELECT * FROM task_events WHERE created_at >= yesterday
2. Transform: normalize fields, calculate derived metrics
3. Batch INSERT vào ClickHouse
→ Không query ClickHouse real-time từ app (chỉ batch analytics)
```

**Checklist deliverable:**

- [ ] Search "login bug" → kết quả trong <100ms, có highlight
- [ ] Admin dashboard: biểu đồ MAU/DAU 30 ngày (data từ ClickHouse)
- [ ] ETL job chạy: log "ETL completed, 1,234 events processed"
- [ ] Fuzzy search: "lgin bug" (typo) → vẫn tìm ra "login bug"

---

### Pha 10 — DevOps, Observability & Security (2–3 tuần)

**Mục tiêu:** Tự động hóa mọi thứ, monitor production, hardening security.

**Dockerfile multi-stage (NestJS):**

```dockerfile
# Stage 1: deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: production (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
USER node  # Không chạy root
CMD ["node", "dist/main.js"]
# Image size: ~150MB thay vì ~800MB
```

**GitHub Actions CI/CD Pipeline:**

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build-and-push:
    needs: test
    steps:
      - name: Build Docker images
        run: docker build -t superboard-api ./apps/api
      - name: Push to registry
        run: docker push ghcr.io/user/superboard-api:${{ github.sha }}

  deploy:
    needs: build-and-push
    steps:
      - name: Rolling deploy to K8s
        run: |
          kubectl set image deployment/api api=ghcr.io/user/superboard-api:${{ github.sha }}
          kubectl rollout status deployment/api --timeout=3m
```

**OpenTelemetry distributed tracing:**

```typescript
// apps/api/src/tracing.ts
// Bao gồm trước khi app start
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({ endpoint: 'http://jaeger:14268/api/traces' }),
  instrumentations: [
    new HttpInstrumentation(),
    new FastifyInstrumentation(),
    new PrismaInstrumentation(),
    new RedisInstrumentation(),
  ],
});
sdk.start();
// → Mỗi request tự động có trace qua toàn bộ service
```

**Prometheus metrics trong NestJS:**

```typescript
// Custom business metrics
const taskCreatedCounter = new Counter({
  name: 'tasks_created_total',
  help: 'Total number of tasks created',
  labelNames: ['workspace_id', 'priority'],
});

const apiLatencyHistogram = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
```

**OWASP Security Checklist:**

- [ ] SQL Injection: Prisma parameterized queries (auto-protected)
- [ ] XSS: Helmet CSP headers, sanitize user input
- [ ] CSRF: SameSite=Strict cookie, CSRF token cho state-changing ops
- [ ] IDOR: mọi query đều filter theo workspaceId của user đang login
- [ ] Mass Assignment: DTOs với whitelist fields (class-validator)
- [ ] Rate Limiting: Redis sliding window
- [ ] Sensitive data: không log passwords/tokens, mask PII trong logs
- [ ] Dependency scan: `npm audit` trong CI pipeline
- [ ] HTTPS only: redirect HTTP → HTTPS tại Nginx

**k6 Load Test:**

```javascript
// load-test.js
export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 1000 }, // Stay at 1000 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests <500ms
    http_req_failed: ['rate<0.01'], // <1% error rate
  },
};

export default function () {
  http.get('http://localhost:4000/api/v1/tasks?projectId=xxx', {
    headers: { Authorization: `Bearer ${token}` },
  });
  sleep(1);
}
```

**Checklist deliverable:**

- [ ] `docker build` → image <200MB
- [ ] Push commit → GitHub Actions xanh → K8s deploy tự động trong 4 phút
- [ ] Jaeger UI: thấy trace của 1 request qua NestJS → Redis → PostgreSQL
- [ ] Grafana dashboard: CPU, memory, request rate, error rate, p95 latency
- [ ] Alert rule: p95 latency >1s → Slack notification
- [ ] k6: 1000 concurrent users, p95 <500ms, error rate <1%
- [ ] `npm audit` trong CI: 0 critical vulnerabilities

---

## Môi Trường Variables

```bash
# apps/api/.env.local (KHÔNG commit)

# Database
DATABASE_URL="postgresql://dev:devpassword@localhost:5432/superboard"

# Redis
REDIS_URL="redis://localhost:6379"

# Keycloak
KEYCLOAK_URL="http://localhost:8080"
KEYCLOAK_REALM="superboard"
KEYCLOAK_CLIENT_ID="superboard-app"
KEYCLOAK_CLIENT_SECRET="xxxxx"
KEYCLOAK_JWKS_URL="http://localhost:8080/realms/superboard/protocol/openid-connect/certs"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="superboard"

# Cookie
COOKIE_SECRET="dev-cookie-secret-min-32-chars-xxx"

# JWT
JWT_SECRET="dev-jwt-secret-min-32-chars-xxxxxx"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# ClickHouse
CLICKHOUSE_URL="http://localhost:8123"
CLICKHOUSE_DB="superboard"

# AI Service
AI_SERVICE_GRPC_URL="localhost:50051"
OPENAI_API_KEY="sk-xxxxx"

# Email (dev: MailHog)
SMTP_HOST="localhost"
SMTP_PORT=1025

# App
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="ws://localhost:4000"
NEXT_PUBLIC_KEYCLOAK_URL="http://localhost:8080"
NEXT_PUBLIC_KEYCLOAK_REALM="superboard"
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID="superboard-app"
```

---

## Điểm Khác Biệt Giữa 2 Roadmap Đã Được Merge

| Chủ đề         | Roadmap cũ         | Roadmap mới (Gemini)      | Quyết định                                                           |
| -------------- | ------------------ | ------------------------- | -------------------------------------------------------------------- |
| Auth           | JWT tự làm + OAuth | Keycloak SSO              | ✅ Keycloak — enterprise-grade, học được nhiều hơn                   |
| Backend        | Fastify            | NestJS                    | ✅ NestJS — cấu trúc tốt hơn khi scale, Guards/Interceptors          |
| Message Queue  | BullMQ             | RabbitMQ / Kafka          | ✅ BullMQ trước → Kafka khi scale (Kafka phức tạp cho giai đoạn đầu) |
| AI Service     | Không có           | Python FastAPI + gRPC     | ✅ Thêm — gRPC rất có giá trị để học                                 |
| Analytics      | Elasticsearch      | ES + ClickHouse + Airflow | ✅ ES + ClickHouse, bỏ Airflow (quá nặng)                            |
| Frontend state | React Query        | Redux / Zustand           | ✅ Zustand (nhẹ hơn Redux, đủ dùng)                                  |
| PWA            | Không có           | PWA + Service Worker      | ✅ Thêm — thực chiến cao                                             |
| CI/CD          | GitHub Actions     | GitLab CI/CD              | ✅ GitHub Actions (phổ biến hơn, free)                               |

---

## Nguồn Tài Liệu Tham Khảo

- Turborepo: https://turbo.build/repo/docs
- NestJS: https://docs.nestjs.com
- Keycloak: https://www.keycloak.org/docs
- Prisma: https://www.prisma.io/docs
- Socket.io: https://socket.io/docs/v4
- BullMQ: https://docs.bullmq.io
- MinIO: https://min.io/docs
- ClickHouse: https://clickhouse.com/docs
- gRPC (Python): https://grpc.io/docs/languages/python
- k6: https://grafana.com/docs/k6
- OpenTelemetry Node.js: https://opentelemetry.io/docs/instrumentation/js

---

_File được tạo để làm context reference. Cập nhật mỗi khi quyết định thay đổi stack hoặc hoàn thành một pha._
