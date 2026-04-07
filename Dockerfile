FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Bake content + media as seed data (copied to volumes on first start)
COPY --from=builder /app/content ./content-seed
COPY --from=builder /app/public/media ./media-seed

# Create writable directories for volumes
RUN mkdir -p /app/content /app/data /app/public/media \
  && chown -R nextjs:nodejs /app/content /app/content-seed /app/data /app/public/media /app/media-seed

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

ENV CONTENT_DIR=/app/content
ENV DATA_DIR=/app/data
ENV MEDIA_DIR=/app/public/media

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
