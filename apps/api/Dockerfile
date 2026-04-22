# Optimized NestJS API Dockerfile using Turbo Prune
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @superboard/api @superboard/shared @superboard/config-ts @superboard/ai-service --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install
RUN npm install @prisma/client@7.5.0

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/turbo.json ./turbo.json

# DEBUG: Check schema content
RUN cat apps/api/prisma/schema.prisma

# Generate Prisma Client
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build --workspace=@superboard/api

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libgcc libstdc++
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

WORKDIR /app

# Copy root configurations
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/package-lock.json ./package-lock.json

# Copy built application and dependencies
COPY --from=installer --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nestjs:nodejs /app/apps/api ./apps/api
COPY --from=installer --chown=nestjs:nodejs /app/apps/ai-service/proto ./apps/ai-service/proto
COPY --from=installer --chown=nestjs:nodejs /app/packages ./packages

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["npm", "start", "--workspace=@superboard/api"]
