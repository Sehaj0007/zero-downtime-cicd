# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS base

WORKDIR /app

COPY package.json ./
# No dependencies to install — uses only Node built-ins

COPY server.js ./

# ── Runtime ───────────────────────────────────────────────────────────────────
EXPOSE 3000

# VERSION is injected at build time via --build-arg, then baked into the image
# as an ENV so it persists at runtime without needing Kubernetes to set it.
ARG APP_VERSION=1.0.0
ENV VERSION=${APP_VERSION}

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]