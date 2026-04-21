# NestJS API Service
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./
COPY apps/ apps/
COPY packages/ packages/

# Install dependencies (use npm)
RUN npm ci --network-timeout=100000

# Copy source code
COPY apps/api apps/api

# Build the application
WORKDIR /app/apps/api
RUN npm run db:generate
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/ apps/
COPY packages/ packages/

# Install production dependencies only
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts --network-timeout=100000

# Copy prisma schema and generate client
COPY apps/api/prisma apps/api/prisma
RUN npx prisma generate --schema apps/api/prisma/schema.prisma

# Copy built application
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/package.json apps/api/

WORKDIR /app/apps/api

EXPOSE 4000

CMD ["node", "dist/main"]
