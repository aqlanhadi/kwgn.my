FROM node:lts-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy the kwgn binary into the image
COPY /bin/kwgn-linux /usr/local/bin/kwgn
RUN chmod +x /usr/local/bin/kwgn

COPY /bin/.kwgn-no-acc.yaml ./.kwgn.yaml
ENV KWGN_CONFIG_PATH=.kwgn.yaml

EXPOSE 3000
CMD ["node", "server.js"]