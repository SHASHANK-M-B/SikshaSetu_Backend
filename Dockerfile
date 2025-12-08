# Base Image: Node 20 on Debian Slim
FROM node:20-slim

# System Dependencies
# Installs FFmpeg (for video) and build tools (for Sharp/Redis)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Directory inside container
WORKDIR /app

# Copy package definitions first (Caching layer)
COPY package*.json ./

# Install dependencies
# --only=production skips devDependencies to save space
RUN npm ci --only=production

# Copy application code
# .dockerignore ensures node_modules is NOT copied here
COPY . .

# Default Port (Cloud Run overrides this, but good practice)
ENV PORT=8080
ENV NODE_ENV=production

# Start Command
CMD ["node", "server.js"]