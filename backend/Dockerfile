FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for Prisma
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=4000

# Copy production artifacts with non-root ownership
COPY --chown=node:node package*.json ./
COPY --chown=node:node node_modules ./node_modules
COPY --chown=node:node dist ./dist
COPY --chown=node:node prisma ./prisma

# Switch to non-root user
USER node

EXPOSE 4000

CMD ["node", "dist/main.js"]
