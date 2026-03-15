FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=shared --workspace=frontend

# Build shared types
FROM deps AS build-shared
COPY shared/ ./shared/
RUN npm run build -w shared

# Build frontend
FROM build-shared AS build
COPY frontend/ ./frontend/
RUN npm run build -w frontend

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=build /app/frontend/.output ./frontend/.output
COPY --from=build /app/frontend/package.json ./frontend/

EXPOSE 3000

CMD ["node", "frontend/.output/server/index.mjs"]
