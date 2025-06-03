FROM node:22.11-alpine AS builder

# Create app directory
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@9.12.2 && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:22.11-alpine

COPY --from=builder /app ./

EXPOSE 3001

CMD npx typeorm --dataSource=dist/common/database/data-source.js migration:run && node dist/index.js