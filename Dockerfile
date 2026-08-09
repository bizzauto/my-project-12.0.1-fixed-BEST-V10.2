# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve (monolith - frontend + backend in one node process)
FROM node:20-alpine AS runner
WORKDIR /app

# Install OS deps needed by Prisma (query engine) + healthcheck
RUN apk add --no-cache openssl wget libc6-compat

# Build args - passed at build time from Coolify (40 env vars including DATABASE_URL etc.)
ARG DATABASE_URL
ARG JWT_SECRET
ARG NEXTAUTH_SECRET
ARG ENCRYPTION_KEY
ARG EVOLUTION_API_URL
ARG EVOLUTION_API_KEY
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET

# Copy built artifacts + deps from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/start.sh ./start.sh

# Create non-root appuser (matches working image)
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
RUN chmod +x start.sh
RUN npx prisma generate 2>&1 | tail -1
RUN chown -R appuser:appgroup /app

# App runs on PORT (default 3000)
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS=--max-old-space-size=768

# Healthcheck - matches working image pattern
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000

USER appuser

ENTRYPOINT ["./start.sh"]