# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
# Place the React build where Express looks for it
COPY --from=frontend-builder /app/client/dist ./public
# Uploads directory (will be mounted as a Fly.io volume in production)
RUN mkdir -p uploads

EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "server.js"]
