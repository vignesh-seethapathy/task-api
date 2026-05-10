# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
# Drizzle and migrations are needed if we run them from inside the container
COPY --from=builder /app/drizzle ./drizzle
COPY drizzle.config.ts .

EXPOSE 3000

CMD ["node", "dist/index.js"]
