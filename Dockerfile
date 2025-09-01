FROM golang:1.23.4-alpine AS go-builder

# Define build argument for GitHub token
ARG GITHUB_TOKEN

# Install git and build dependencies
RUN apk add --no-cache git

# Clone and build the kwgn binary
# Warning: Using ARG is less secure than BuildKit secrets, but more compatible with some CI systems
RUN git clone --depth=1 https://${GITHUB_TOKEN}@github.com/aqlanhadi/kwgn-cli && \
    cd kwgn-cli && \
    go mod download && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /go/bin/kwgn-cli . && \
   
    # Remove source code and credentials after building to reduce layer size
    cd / && rm -rf /go/src/* /root/.cache/go-build

FROM alpine AS base

# Create directory for config first
RUN mkdir -p /etc/kwgn

COPY --from=go-builder /go/bin/kwgn-cli /usr/local/bin/kwgn
RUN chmod +x /usr/local/bin/kwgn

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

COPY package.json pnpm-lock.yaml ./
# Use production dependencies only
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --prod=false

# Stage 2: Build the application
FROM base AS nextjs-builder
WORKDIR /app

# Install Node.js and npm
RUN apk add --no-cache nodejs npm

COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build application and clean up in the same layer
RUN npm install -g pnpm && \
    pnpm run build && \
    # Clean up build artifacts not needed in production
    rm -rf node_modules/.cache && \
    rm -rf .next/cache

# Stage 3: Production server
FROM node:lts-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create directory for config
RUN mkdir -p /etc/kwgn

# Copy only the necessary files for production
COPY --from=go-builder /go/bin/kwgn-cli /usr/local/bin/kwgn
RUN chmod +x /usr/local/bin/kwgn && \
    # Remove unnecessary packages and files
    rm -rf /var/cache/apk/* && \
    # Create a non-root user if not already created
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy application files
COPY --from=nextjs-builder /app/.next/standalone ./
COPY --from=nextjs-builder /app/.next/static ./.next/static
COPY --from=nextjs-builder /app/public ./public

# Set proper ownership
RUN chown -R nextjs:nodejs /app && \
    chown -R nextjs:nodejs /etc/kwgn

# Use non-root user for security
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]