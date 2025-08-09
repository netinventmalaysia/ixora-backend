FROM node:18-alpine AS builder
WORKDIR /app

COPY . .

RUN npm install

# 👉 Add this to fix "nest: Permission denied"
RUN chmod -R +x node_modules/.bin

RUN npm run build

# Optional: Run migration here if you want
# RUN npx typeorm migration:run

# Runtime Stage (Optional if you use multi-stage builds)
FROM node:18-alpine AS runtime
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env .env

CMD ["node", "dist/main"]