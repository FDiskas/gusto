FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG BUN_PUBLIC_GOOGLE_CLIENT_ID
ENV BUN_PUBLIC_GOOGLE_CLIENT_ID=$BUN_PUBLIC_GOOGLE_CLIENT_ID
RUN bun test && bun run build

FROM nginxinc/nginx-unprivileged:alpine
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080