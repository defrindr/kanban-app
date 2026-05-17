FROM node:20-slim AS development

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 3001
CMD ["npm", "run", "dev"]

# =============================================================================
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

COPY prisma ./prisma/
RUN npx prisma generate

COPY --from=development /app/dist ./dist

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/health').then(r => r.json()).then(d => process.exit(d.status === 'ok' ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]