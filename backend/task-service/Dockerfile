# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ---------- Runtime ----------
FROM base AS runner

# Security: non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# Copy only required runtime files
COPY --from=deps /app/node_modules ./node_modules
COPY Controllers ./Controllers
COPY models ./models
COPY routes ./routes
COPY redis ./redis
COPY middleware ./middleware
COPY index.js .
COPY package.json .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "index.js"]
