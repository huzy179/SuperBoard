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
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

# Build the project
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/turbo.json ./turbo.json

# Generate Prisma Client (pointing to the api schema)
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN npx turbo run build --filter=@superboard/collab-service

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

# Copy built application and dependencies
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/collab-service/package.json ./apps/collab-service/package.json
COPY --from=installer /app/apps/collab-service/dist ./apps/collab-service/dist

ENV NODE_ENV=production
EXPOSE 1234

CMD ["node", "apps/collab-service/dist/index.js"]
