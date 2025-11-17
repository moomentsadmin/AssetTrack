# Stage 1: Build Frontend & Backend
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Stage 3: Production Image
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install PostgreSQL client for health checks
RUN apk add --no-cache postgresql-client

# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Create a non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

# Healthcheck to ensure the application is running and the database is reachable
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD wget -q --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/index.js"]
