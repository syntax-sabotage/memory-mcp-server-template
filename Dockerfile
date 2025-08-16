# VPS Memory MCP Server Dockerfile
# Multi-stage build for production-ready container

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vps-memory -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy essential files
COPY README.md LICENSE CHANGELOG.md ./

# Change ownership to non-root user
RUN chown -R vps-memory:nodejs /app
USER vps-memory

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/index.js --test || exit 1

# Expose port (if needed for future HTTP transport)
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV VPS_MEMORY_TIMEOUT=30000
ENV VPS_MEMORY_RETRY_ATTEMPTS=3
ENV VPS_MEMORY_RETRY_DELAY=1000

# Default command
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL maintainer="Syntax Sabotage Team <team@syntax-sabotage.com>"
LABEL version="1.0.0"
LABEL description="Professional MCP server for VPS memory system"
LABEL org.opencontainers.image.title="VPS Memory MCP Server"
LABEL org.opencontainers.image.description="Professional MCP server for VPS memory system with 790+ memories"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Syntax Sabotage"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/syntax-sabotage/vps-memory-mcp-server"
LABEL org.opencontainers.image.documentation="https://github.com/syntax-sabotage/vps-memory-mcp-server#readme"