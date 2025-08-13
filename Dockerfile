FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install --production=false
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]