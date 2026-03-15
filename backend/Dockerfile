FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
RUN npm ci --workspace=shared --workspace=backend

# Build shared types
FROM deps AS build-shared
COPY shared/ ./shared/
RUN npm run build -w shared

# Build backend
FROM build-shared AS build
COPY backend/ ./backend/
RUN npm run build -w backend

# Production image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/shared/package.json ./shared/
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/
COPY --from=build /app/backend/src/migrations ./backend/src/migrations
COPY --from=build /app/package.json ./

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
