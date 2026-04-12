FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies needed for monorepo
COPY package.json package-lock.json ./
COPY apps/collab-service/package.json ./apps/collab-service/
COPY apps/api/prisma ./apps/api/prisma

RUN npm install

# Copy source
COPY apps/collab-service ./apps/collab-service

# Generate Prisma Client
RUN npm run db:generate --workspace @superboard/api
RUN cd apps/collab-service && npx prisma generate --schema ../api/prisma/schema.prisma

# Build
RUN npm run build --workspace @superboard/collab-service

EXPOSE 1234

CMD ["npm", "run", "start", "--workspace", "@superboard/collab-service"]
