# UdyamAI · Cloud Run image
#
# Three stages so the thing that ships is only what runs: install once, build
# once, then copy the Next.js standalone output into a clean base. Final image
# is ~200 MB and starts in well under a second, which matters because Cloud Run
# scales this to zero between demos.
#
# Build:  docker build -t udyamai .
# Run:    docker run -p 8080:8080 -e GOOGLE_API_KEY=... udyamai

# ─── deps ────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci needs the lockfile to match package.json exactly — it will fail loudly
# rather than silently resolving a different tree, which is the point.
RUN npm ci

# ─── build ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Switches next.config.mjs to `output: "standalone"`. Only the container build
# sets this — Amplify SSR wants stock output. See next.config.mjs.
ENV NEXT_STANDALONE=1
RUN npm run build

# ─── runner ──────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Cloud Run injects PORT; 8080 is its default and the right local default too.
ENV PORT=8080
# Bind all interfaces — Next's standalone server defaults to localhost, which a
# container's health check cannot reach.
ENV HOSTNAME=0.0.0.0
# Mutable demo state (loan pipeline, retrain runs) goes to /tmp. Cloud Run sets
# K_SERVICE and src/lib/runtimeStore.ts would pick /tmp anyway, but `docker run`
# does not — and /app is root-owned, so the non-root user below cannot write a
# .data directory there. Pinning it here makes the image behave identically
# whether it runs on Cloud Run or on a laptop.
ENV UDYAMAI_DATA_DIR=/tmp/udyamai

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The AgamiAI corpus needs no COPY — src/lib/agami/dataset.ts imports the three
# fixtures, so webpack compiles them into the server bundle that .next/standalone
# already carries.

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
