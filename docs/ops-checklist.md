# Operational Checklist — Health Checks & Environment Variables

> Requirement: 5.8 — Core API phải cung cấp operational checklist ghi lại required environment variables và expected health check responses cho local và staging environments.

---

## 1. Core API (`apps/api`)

### Required Environment Variables

| Variable            | Required | Default                 | Description                                                              |
| ------------------- | -------- | ----------------------- | ------------------------------------------------------------------------ |
| `NODE_ENV`          | Yes      | `development`           | Runtime environment (`development`, `staging`, `production`)             |
| `PORT`              | Yes      | `4000`                  | HTTP port the API listens on                                             |
| `DATABASE_URL`      | Yes      | —                       | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5433/db` |
| `REDIS_URL`         | Yes      | —                       | Redis connection string, e.g. `redis://localhost:6379`                   |
| `ENABLE_REDIS`      | No       | `false`                 | Enable Redis integration (`true`/`false`)                                |
| `ENABLE_QUEUE`      | No       | `false`                 | Enable BullMQ queue processing (`true`/`false`)                          |
| `QUEUE_NAME`        | No       | `superboard-dev`        | BullMQ queue name                                                        |
| `JWT_SECRET`        | Yes      | —                       | Secret key for JWT signing/verification                                  |
| `JWT_EXPIRES_IN`    | No       | `1d`                    | JWT token expiry duration                                                |
| `FRONTEND_URL`      | No       | `http://localhost:3000` | Allowed CORS origin for the frontend                                     |
| `AI_SERVICE_URL`    | No       | `http://localhost:8000` | Base URL for the AI Service HTTP API                                     |
| `ELASTICSEARCH_URL` | No       | `http://localhost:9200` | Elasticsearch connection URL                                             |

### Health Check Endpoints

#### `GET /health` — Liveness

Returns `200 OK` as long as the process is running. Does not check dependencies.

**Local response:**

```json
{
  "status": "ok",
  "service": "core-api",
  "version": "0.1.0",
  "uptime": 42,
  "dependencies": []
}
```

**Staging response:** identical shape; `version` reflects the deployed package version.

#### `GET /ready` — Readiness

Checks PostgreSQL (`SELECT 1`), Redis (`PING`), and BullMQ queue connection.

**Healthy response — `200 OK`:**

```json
{
  "status": "ok",
  "service": "core-api",
  "version": "0.1.0",
  "uptime": 42,
  "dependencies": [
    { "name": "postgres", "status": "healthy", "latencyMs": 3 },
    { "name": "redis", "status": "healthy", "latencyMs": 1 },
    { "name": "bullmq", "status": "healthy", "latencyMs": 2 }
  ]
}
```

**Unhealthy response — `503 Service Unavailable`:**

```json
{
  "status": "not_ready",
  "service": "core-api",
  "version": "0.1.0",
  "uptime": 42,
  "dependencies": [
    {
      "name": "postgres",
      "status": "unhealthy",
      "latencyMs": 5001,
      "error": "connect ECONNREFUSED 127.0.0.1:5433"
    },
    { "name": "redis", "status": "healthy", "latencyMs": 1 },
    { "name": "bullmq", "status": "healthy", "latencyMs": 2 }
  ]
}
```

### How to Verify

```bash
# Liveness
curl -s http://localhost:4000/health | jq .

# Readiness
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/ready
# Expected: 200 (healthy) or 503 (dependency down)

# Full readiness body
curl -s http://localhost:4000/ready | jq .dependencies
```

---

## 2. AI Service (`apps/ai-service`)

### Required Environment Variables

| Variable            | Required    | Default                  | Description                              |
| ------------------- | ----------- | ------------------------ | ---------------------------------------- |
| `APP_ENV`           | No          | `development`            | Runtime environment                      |
| `PORT`              | Yes         | `8000`                   | HTTP port for FastAPI server             |
| `GRPC_PORT`         | Yes         | `50051`                  | Port the gRPC server listens on          |
| `GRPC_HOST`         | Yes         | `localhost`              | Host the gRPC server binds to            |
| `AI_PROVIDER`       | Yes         | —                        | AI provider to use: `gemini` or `openai` |
| `GEMINI_API_KEY`    | Conditional | —                        | Required when `AI_PROVIDER=gemini`       |
| `OPENAI_API_KEY`    | Conditional | —                        | Required when `AI_PROVIDER=openai`       |
| `API_URL`           | No          | `http://localhost:4000`  | Core API base URL (for callbacks)        |
| `REDIS_URL`         | No          | `redis://localhost:6379` | Redis connection string                  |
| `ELASTICSEARCH_URL` | No          | `http://localhost:9200`  | Elasticsearch connection URL             |

### Health Check Endpoints

#### `GET /health` — Liveness

Always returns `200 OK` regardless of dependency state.

**Local / Staging response:**

```json
{
  "status": "ok",
  "service": "ai-service"
}
```

#### `GET /ready` — Readiness

Checks that the gRPC server is listening and that `AI_PROVIDER` + API key are configured.

**Healthy response — `200 OK`:**

```json
{
  "status": "ready",
  "dependencies": [
    { "name": "grpc", "status": "healthy" },
    { "name": "model", "status": "healthy" }
  ]
}
```

**Unhealthy response — `503 Service Unavailable`:**

```json
{
  "status": "not_ready",
  "dependencies": [
    { "name": "grpc", "status": "unhealthy", "error": "gRPC server not listening on port 50051" },
    { "name": "model", "status": "unhealthy", "error": "AI provider or API key not configured" }
  ]
}
```

### How to Verify

```bash
# Liveness
curl -s http://localhost:8000/health | jq .

# Readiness
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/ready
# Expected: 200 (healthy) or 503 (dependency down)

# Full readiness body
curl -s http://localhost:8000/ready | jq .dependencies

# Verify gRPC port is listening (default 50051)
nc -zv localhost 50051
```

---

## 3. Collaboration Service (`apps/collab-service`)

### Required Environment Variables

| Variable       | Required | Default   | Description                                               |
| -------------- | -------- | --------- | --------------------------------------------------------- |
| `DATABASE_URL` | Yes      | —         | PostgreSQL connection string (same DB as Core API)        |
| `REDIS_URL`    | No       | —         | Redis connection string; if unset, Redis check is skipped |
| `COLLAB_PORT`  | No       | `1234`    | Port for the Hocuspocus WebSocket server                  |
| `COLLAB_HOST`  | No       | `0.0.0.0` | Bind address for the WebSocket server                     |
| `HEALTH_PORT`  | No       | `3001`    | Port for the HTTP health check server                     |
| `HEALTH_HOST`  | No       | `0.0.0.0` | Bind address for the health check server                  |
| `JWT_SECRET`   | Yes      | —         | Secret key for validating client JWT tokens               |

### Health Check Endpoints

The health server runs on `HEALTH_PORT` (default `3001`), separate from the WebSocket server.

#### `GET /health` — Liveness

Always returns `200 OK`.

**Local / Staging response:**

```json
{
  "status": "ok",
  "service": "collab-service"
}
```

#### `GET /ready` — Readiness

Checks TCP connectivity to Redis (if `REDIS_URL` is set). If `REDIS_URL` is not configured, the service is considered ready with no dependencies.

**Healthy response — `200 OK`:**

```json
{
  "status": "ready",
  "dependencies": [{ "name": "redis", "status": "healthy" }]
}
```

**Unhealthy response — `503 Service Unavailable`:**

```json
{
  "status": "not_ready",
  "dependencies": [{ "name": "redis", "status": "unhealthy", "error": "Connection timed out" }]
}
```

**When `REDIS_URL` is not set — `200 OK`:**

```json
{
  "status": "ready",
  "dependencies": []
}
```

### How to Verify

```bash
# Liveness (health server runs on HEALTH_PORT, default 3001)
curl -s http://localhost:3001/health | jq .

# Readiness
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/ready
# Expected: 200 (healthy) or 503 (Redis unreachable)

# Full readiness body
curl -s http://localhost:3001/ready | jq .dependencies

# Verify WebSocket server is listening (default 1234)
nc -zv localhost 1234
```

---

## 4. Quick Reference — Port Summary

| Service               | HTTP / WS Port         | Health Port            | gRPC Port             |
| --------------------- | ---------------------- | ---------------------- | --------------------- |
| Core API              | `4000` (`PORT`)        | same as HTTP           | —                     |
| AI Service            | `8000` (`PORT`)        | same as HTTP           | `50051` (`GRPC_PORT`) |
| Collaboration Service | `1234` (`COLLAB_PORT`) | `3001` (`HEALTH_PORT`) | —                     |

---

## 5. Staging Environment Notes

- All environment variables must be injected via the deployment platform (e.g. Kubernetes Secrets, Docker Compose `.env`, or CI/CD secrets). No values should be hardcoded.
- `DATABASE_URL` and `REDIS_URL` must point to staging-specific instances, not local ones.
- `AI_PROVIDER` and the corresponding API key (`GEMINI_API_KEY` or `OPENAI_API_KEY`) must be set before the AI Service `/ready` endpoint returns `200`.
- Health check endpoints are unauthenticated and should be accessible to load balancers and orchestrators without a JWT token.
- Recommended readiness probe configuration (Kubernetes):
  ```yaml
  readinessProbe:
    httpGet:
      path: /ready
      port: <service-port>
    initialDelaySeconds: 10
    periodSeconds: 15
    failureThreshold: 3
  livenessProbe:
    httpGet:
      path: /health
      port: <service-port>
    initialDelaySeconds: 5
    periodSeconds: 30
  ```
