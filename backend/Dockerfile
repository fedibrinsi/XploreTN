# Build stage
FROM node:20-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
ARG DATABASE_URL="postgresql://user:password@localhost/db"
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate

COPY . .
RUN npm run build

# Runtime stage
FROM node:20-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/uploads ./uploads

ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "dist/index.js"]