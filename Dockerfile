# ---------- Client Build Stage ----------
FROM node:18-alpine AS client-builder
WORKDIR /app/client

# Copy client dependencies
COPY client/package*.json ./
RUN npm install

# Copy the full client folder and build
COPY client ./
RUN npm run build



# ---------- Server Stage ----------
FROM node:18-alpine
WORKDIR /app

# Copy server dependencies
COPY package*.json ./
RUN npm ci --production

# Copy backend code
COPY server.js ./
COPY models ./models/

# Copy built client output into public
COPY --from=client-builder /app/client/dist ./public

# Create uploads folder for file storage
RUN mkdir -p uploads

# Expose App Port
ENV PORT=4000
EXPOSE 4000

# Run server
CMD ["node", "server.js"]