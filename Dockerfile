# api/Dockerfile
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies (use package.json and package-lock.json)
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose port your app listens on (change if your app uses another port)
ENV PORT=5000
EXPOSE 5000

# Run the app (change "index.js" to your entry file if different)
CMD ["node", "index.js"]
