# --- Stage 1: install dependencies ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# --- Stage 2: final runtime image ---
FROM node:22-alpine AS runner
WORKDIR /app

# Threat model note: run as a non-root, unprivileged user inside the
# container — limits blast radius if the process is ever compromised
# (same intent as the Kyverno "non-root container" policy from the
# original Kubernetes plan, now enforced at the Dockerfile level instead).
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY routes ./routes
COPY utils ./utils
COPY server.js ./

# Uploaded files need a writable directory owned by the non-root user.
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-v*
USER appuser

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode===200?0:1)).on('error', ()=>process.exit(1))"

CMD ["node", "server.js"]
