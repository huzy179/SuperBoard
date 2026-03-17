# Docker Configuration

This folder contains all Docker-related configurations for the SuperBoard project.

## Files

- **Dockerfile.api** - NestJS API service (Node.js)
- **Dockerfile.web** - Next.js web application (Node.js)
- **Dockerfile.ai** - Python AI service with gRPC
- **docker-compose.yml** - Docker Compose orchestration file
- **.dockerignore** - Files to exclude from Docker builds

## Services

### Infrastructure Services

- **postgres** - PostgreSQL database (port 5433)
- PostgreSQL dùng 2 database logical:
  - `superboard` cho app data
  - `keycloak` cho auth data
- **redis** - Redis cache (port 6379)
- **elasticsearch** - Elasticsearch search engine (port 9200)
- **minio** - S3-compatible object storage (port 9000, 9001)
- **keycloak** - Authentication service (port 8080)
- **mailhog** - Email testing service (port 1025, 8025)

### Application Services

- **api** - NestJS REST API (port 3000)
- **web** - Next.js web application (port 3001)
- **ai-service** - Python AI service with gRPC (port 50051)

## Usage

### Start all services

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Stop all services

```bash
docker-compose -f docker/docker-compose.yml down
```

### Rebuild services

```bash
docker-compose -f docker/docker-compose.yml build
```

### View logs

```bash
docker-compose -f docker/docker-compose.yml logs -f
```

### View specific service logs

```bash
docker-compose -f docker/docker-compose.yml logs -f api
```

## Environment Variables

Update environment variables in `docker-compose.yml` or create a `.env` file:

```bash
DATABASE_URL=postgresql://dev:devpassword@postgres:5432/superboard
KEYCLOAK_DB_URL=postgresql://dev:devpassword@postgres:5432/keycloak
REDIS_URL=redis://redis:6379
ELASTICSEARCH_URL=http://elasticsearch:9200
KEYCLOAK_URL=http://keycloak:8080
NEXT_PUBLIC_API_URL=http://api:3000
```

## Network

All services are connected to the `superboard` bridge network for inter-service communication.

## Volumes

- **postgres_data** - PostgreSQL database persistence
- **minio_data** - MinIO data storage
- **elasticsearch_data** - Elasticsearch indices storage

## Health Checks

All services include health checks. View service health:

```bash
docker-compose -f docker/docker-compose.yml ps
```
