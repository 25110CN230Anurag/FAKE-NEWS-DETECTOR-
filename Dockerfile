# ==========================================
# TruthLens AI — Production Multi-Stage Dockerfile
# ==========================================

# Stage 1: Build Frontend Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Server Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy compiled frontend from client-builder
COPY --from=client-builder /app/client/dist ./client/dist

# Expose port (Cloud providers inject $PORT dynamically)
EXPOSE 5000

# Start server
CMD ["node", "server/src/index.js"]
