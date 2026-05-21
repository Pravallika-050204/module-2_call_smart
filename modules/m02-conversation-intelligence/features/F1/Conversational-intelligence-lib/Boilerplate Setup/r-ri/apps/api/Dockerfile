FROM node:20-bullseye-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.14.0

WORKDIR /app
COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store rm -rf node_modules && pnpm install --no-frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter database exec prisma generate

EXPOSE 3001
CMD ["pnpm", "--filter", "api", "dev"]
