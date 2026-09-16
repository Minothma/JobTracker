# ==========================================
# Stage 1: Build & Compile TypeScript
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma engine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 2: Production Runtime (Non-Root)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled Prisma client and dist build artifacts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist

# Use unprivileged node user
USER node

EXPOSE 4000

CMD ["node", "dist/main.js"]
