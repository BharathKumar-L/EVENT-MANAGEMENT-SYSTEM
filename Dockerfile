# Multi-stage build: Build client, then server
FROM node:18-alpine AS client-builder
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Server stage
FROM node:18-alpine
WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm ci --production

# Copy server source
COPY server.js ./
COPY models/ ./models/
COPY web.config ./

# Copy built client from builder stage
COPY --from=client-builder /client/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose port
ENV PORT=4000
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the app
CMD ["node", "server.js"]
