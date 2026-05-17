FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/worker/package*.json ./apps/worker/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --ignore-scripts

COPY packages/shared/ ./packages/shared/
RUN npm run build -w packages/shared

COPY apps/api/ ./apps/api/
RUN npm run build -w apps/api

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/packages/shared/ ./packages/shared/
COPY --from=builder /app/apps/api/ ./apps/api/

RUN mkdir -p tmp

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4000
ENV ALLOW_LIVE_FETCH=true

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
