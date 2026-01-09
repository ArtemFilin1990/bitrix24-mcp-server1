# syntax=docker/dockerfile:1
# Multi-stage Node.js build for bitrix24-mcp-server

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache tini

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --ignore-scripts

# ---- Build ----
FROM deps AS build
COPY . .
RUN npm run build || true

# ---- Release ----
FROM base AS release
ENV NODE_ENV=production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs

# Copy only what we need
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./dist
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/package.json ./package.json
COPY start.sh ./start.sh

RUN chmod +x start.sh && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./start.sh"]
