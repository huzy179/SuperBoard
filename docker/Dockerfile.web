# Next.js Web Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package.json package-lock.json ./
COPY apps/ apps/
COPY packages/ packages/

# Install dependencies
RUN npm ci --network-timeout=100000

# Copy source code
COPY apps/web apps/web
COPY apps/web/.env.example apps/web/.env.production

# Build the application
WORKDIR /app/apps/web
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

# Copy built application
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public
COPY apps/web/package.json apps/web/
COPY apps/web/.env.example apps/web/.env.production

WORKDIR /app/apps/web

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
