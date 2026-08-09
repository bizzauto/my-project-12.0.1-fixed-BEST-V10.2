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

# Install OS deps needed by Prisma (query engine)
RUN apk add --no-cache openssl libc6-compat

# Copy built artifacts + deps from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/start.sh ./start.sh

RUN chmod +x start.sh
RUN npx prisma generate 2>&1 | tail -1

# App runs on PORT (default 3000 per package.json)
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["sh", "./start.sh"]