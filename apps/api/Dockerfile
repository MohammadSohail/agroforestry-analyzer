# Multi-stage build for the Agroforestry Analyzer API.
# Build context is the REPO ROOT (so the pnpm workspace + lockfile are available).
#   docker build -f apps/api/Dockerfile -t agro-api .

# ---- build stage ----
FROM node:22-slim AS build
RUN corepack enable && apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# Install the workspace (api + web), leveraging Docker layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --prod=false

# Build the React dashboard first (no VITE_API_URL -> same-origin relative calls),
# then the API (prisma client + nest compile). The API serves apps/web/dist at "/".
COPY apps/web apps/web
RUN pnpm --filter @agro/web build
COPY apps/api apps/api
RUN pnpm --filter @agro/api exec prisma generate \
  && pnpm --filter @agro/api build

# ---- runtime stage ----
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /repo/apps/api

# Copy the resolved workspace (preserves pnpm's symlinked node_modules tree).
COPY --from=build /repo /repo

EXPOSE 3000
# Apply pending migrations, then start. DATABASE_URL is provided by the platform.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
