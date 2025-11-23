# Multi-stage Dockerfile for Asset Management System
# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (compiles TypeScript)
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
# IMPORTANT: Install BEFORE setting NODE_ENV=production, otherwise npm skips devDependencies
# Required in production for:
# - vite: imported by server/vite.ts (even though only dev mode uses it)
# - drizzle-kit: needed for database migrations at runtime
# - tsx: required by drizzle-kit to read TypeScript schema files
RUN npm ci

# Set NODE_ENV after npm install to avoid skipping devDependencies
ENV NODE_ENV=production

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/shared ./shared
# NOTE: tracking-agent assets are intentionally NOT copied into the production
# image by default. Device tracking is optional and disabled by default. If you
# need to include installers in an image for your deployment, add a COPY step
# during your internal image build process.

# Copy entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Healthcheck is defined in docker-compose.yml for better control

# Start the application via entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/index.js"]
