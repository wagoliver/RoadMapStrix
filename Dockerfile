# syntax=docker/dockerfile:1

# ──────────────────────────────────────────
# Stage 1: deps — instala dependências
# ──────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ──────────────────────────────────────────
# Stage 2: builder — compila o Next.js
# ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client para PostgreSQL antes do build
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ──────────────────────────────────────────
# Stage 3: runner — imagem final mínima
# ──────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia apenas o necessário do build
RUN mkdir -p ./public
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/pg ./node_modules/pg
COPY --from=builder /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=builder /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder /app/node_modules/pgpass ./node_modules/pgpass

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Aplica schema e inicia o app
CMD ["sh", "-c", "npx prisma db push --url \"$DATABASE_URL\" --accept-data-loss 2>/dev/null; node server.js"]
