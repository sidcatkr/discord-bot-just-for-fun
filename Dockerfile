FROM node:22-slim

# Install build tools for better-sqlite3 native addon
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies (builds better-sqlite3 inside container)
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Persist the SQLite DB outside the container
VOLUME ["/app/data"]

# Default: start the bot
CMD ["pnpm", "start"]
