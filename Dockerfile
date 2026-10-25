# Multi-stage Dockerfile for ETERNAL BLOOM
FROM node:22-slim AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies
RUN npm install

# Copy source code
COPY server ./server
COPY client ./client

# Build client and server
RUN npm run build

# Production runtime stage
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV TIMEZONE=America/Bogota

# Copy package files and install only production dependencies
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install --omit=dev

# Copy compiled artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 3001

# Start autonomous server
CMD ["node", "server/dist/index.js"]
