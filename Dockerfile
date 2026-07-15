FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
# --ignore-scripts skips the postinstall (copy-vad-assets.mjs); the source
# tree isn't present yet at this layer. VAD/ORT assets are copied later by
# the build's prebuild hook, after `COPY . .`.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM caddy:2-alpine
WORKDIR /app
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist ./dist
