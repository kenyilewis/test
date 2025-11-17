FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++

FROM base AS dependencies

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS build

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache \
    vips \
    curl

COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

RUN mkdir -p /app/output

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/api/docs || exit 1

CMD ["node", "dist/main"]

