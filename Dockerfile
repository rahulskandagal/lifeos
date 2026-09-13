# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXTAUTH_SECRET is only needed at runtime; a placeholder keeps `next build`
# from complaining while it prerenders auth-aware pages.
ENV NEXTAUTH_SECRET=build-time-placeholder
RUN npm run build

# ---- run ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# SQLite lives here — mount a persistent volume at this path.
ENV LIFEOS_DATA_DIR=/app/data

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# client.ts bootstraps the schema from this file at startup.
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db/schema.sql ./src/lib/db/schema.sql

USER nextjs
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server.js"]
