FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./
COPY apps/ apps/
COPY packages/ packages/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code (already copied by apps/ above, but ensuring consistency)
# Generate Prisma Client
RUN npm run db:generate --workspace @superboard/api

# Build
RUN npm run build --workspace @superboard/collab-service

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json ./
COPY apps/ apps/
COPY packages/ packages/

# Install production dependencies only
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts --network-timeout=100000

# Copy built application and prisma
COPY --from=builder /app/apps/collab-service/dist ./apps/collab-service/dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 1234

CMD ["npm", "run", "start", "--workspace", "@superboard/collab-service"]
