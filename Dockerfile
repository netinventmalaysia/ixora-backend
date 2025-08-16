# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps using lockfile for reproducibility
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# accept build-time envs for Nest.js
ARG NEST_PUBLIC_BUILD_SHA
ARG NEST_PUBLIC_BUILD_TIME
ENV NEST_PUBLIC_BUILD_SHA=$NEST_PUBLIC_BUILD_SHA \
    NEST_PUBLIC_BUILD_TIME=$NEST_PUBLIC_BUILD_TIME

RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output
COPY --from=builder /app/dist ./dist

EXPOSE 3000
# Match your package.json "start:prod": node dist/main
CMD ["node", "dist/main"]
