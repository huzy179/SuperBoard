# Optimized Collab Service Dockerfile using Turbo Prune
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
# We include api because we need its prisma schema
RUN turbo prune @superboard/collab-service @superboard/api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:20-alpine AS installer
RUN apk add --no-cache python3 make g++ openssl libc6-compat
WORKDIR /app

# First install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install
RUN npm install @prisma/client@7.5.0 esbuild

# Build the project
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/turbo.json ./turbo.json

# DEBUG: Check schema content
RUN cat apps/api/prisma/schema.prisma

# Generate Prisma Client
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npm run build --workspace=@superboard/collab-service

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libgcc libstdc++
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

# Copy root configurations
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/package-lock.json ./package-lock.json

# Copy built application and dependencies
COPY --from=installer --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nodejs:nodejs /app/apps/collab-service ./apps/collab-service
COPY --from=installer --chown=nodejs:nodejs /app/packages ./packages

ENV NODE_ENV=production
EXPOSE 1234

CMD ["npm", "start", "--workspace=@superboard/collab-service"]
