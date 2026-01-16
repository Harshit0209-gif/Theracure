
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app


COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile


FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm prisma:generate
RUN pnpm generate:enums
RUN pnpm build


FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libxkbcommon0 \
    libgbm1 \
    libgtk-3-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

ENV CHROMIUM_FLAGS="\
--no-sandbox \
--disable-setuid-sandbox \
--disable-dev-shm-usage \
--disable-gpu \
--disable-crash-reporter \
--disable-features=Crashpad \
--disable-background-networking \
--disable-default-apps \
--disable-extensions \
"

RUN chmod 1777 /tmp


WORKDIR /app


ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1


RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs


COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Install Prisma in isolated directory and generate client
RUN mkdir /tmp/prisma-gen && \
    cp -r ./prisma /tmp/prisma-gen/ && \
    cd /tmp/prisma-gen && \
    npm init -y && \
    npm install prisma@6.19.0 @prisma/client@6.19.0 && \
    npx prisma generate && \
    mkdir -p /app/node_modules && \
    rm -rf /app/node_modules/.prisma /app/node_modules/@prisma && \
    cp -r node_modules/.prisma /app/node_modules/ && \
    cp -r node_modules/@prisma /app/node_modules/ && \
    rm -rf /tmp/prisma-gen

RUN mkdir -p /app/uploads


RUN chown -R nextjs:nodejs /app

USER nextjs


EXPOSE 3001

ENV PORT=3001


CMD ["node", "server.js"]
