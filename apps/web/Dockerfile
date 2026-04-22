# Optimized Next.js Web Dockerfile using Turbo Prune
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @superboard/web @superboard/shared @superboard/ui @superboard/config-ts --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:20-slim AS installer
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# First install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

# Build the project
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/turbo.json ./turbo.json

# Build with environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@superboard/web

FROM node:20-slim AS runner
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs
USER nextjs

WORKDIR /app

# Copy built application and dependencies
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/web/package.json ./apps/web/package.json
COPY --from=installer /app/apps/web/.next ./apps/web/.next
COPY --from=installer /app/apps/web/public ./apps/web/public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start", "--workspace=@superboard/web"]
