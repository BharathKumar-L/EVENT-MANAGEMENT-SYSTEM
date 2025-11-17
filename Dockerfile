# ---------- Client Build Stage ----------
FROM node:18-alpine AS client-builder
WORKDIR /client

COPY client/package*.json ./
RUN npm install

COPY client ./
RUN npm run build



# ---------- Server Stage ----------
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY server.js ./
COPY models ./models/

COPY --from=client-builder /client/dist ./public

RUN mkdir -p uploads

ENV PORT=4000
EXPOSE 4000

CMD ["node", "server.js"]