# Multi-stage build for Railway deployment.
# Stage 1: install and build. Stage 2: run.
# Because shipping node_modules to production is a cry for help.

# -- Build stage --
FROM node:22-slim AS builder

WORKDIR /app

# Copy workspace root files for monorepo resolution
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src
COPY apps/backend/package.json apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src

RUN npm ci --workspace=@timetorelax/shared --workspace=@timetorelax/backend

RUN npx turbo run build --filter=@timetorelax/backend

# -- Production stage --
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json /app/turbo.json ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

RUN npm ci --workspace=@timetorelax/shared --workspace=@timetorelax/backend --omit=dev

EXPOSE 3000

CMD ["node", "apps/backend/dist/i-can-stop-anytime.js"]
