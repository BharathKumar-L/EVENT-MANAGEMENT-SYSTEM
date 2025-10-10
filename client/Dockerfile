# client/Dockerfile (build static and serve with nginx)
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps and build
COPY package*.json ./
RUN npm install
COPY . .
# For Vite: build writes to /dist ; for CRA: build writes to /build
# Adjust the build command if your project uses a different script
RUN npm run build

# Serve with nginx
FROM nginx:stable-alpine
# Copy built static files from builder stage
# If Vite -> dist, if CRA -> build  (adjust the path below if needed)
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config to enable client-side routing and proxy /api to backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
