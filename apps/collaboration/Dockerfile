FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @superboard/collaboration --docker

FROM node:22-alpine AS installer
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install
COPY --from=builder /app/out/full/ .
COPY --from=builder /app/turbo.json ./turbo.json
RUN npx turbo run build --filter=@superboard/collaboration

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs
COPY --from=installer --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=installer --chown=nodejs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=installer --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nodejs:nodejs /app/apps/collaboration ./apps/collaboration
COPY --from=installer --chown=nodejs:nodejs /app/packages ./packages
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "apps/collaboration/dist/main.js"]
