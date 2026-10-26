# Build the SPA with the Node.js version build.gradle uses.
FROM docker.io/library/node:16.14.0-bullseye-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src src
RUN npx ng build

# Serve it with nginx, as an unprivileged user like the earlier buildpack image.
FROM docker.io/nginxinc/nginx-unprivileged:1.30.6-alpine
# The entrypoint writes templates/nginx.conf.template to /etc/nginx/nginx.conf, filling in the
# environment variables, such as PORT.
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx \
    PORT=9004
USER root
RUN rm /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*
USER nginx
COPY nginx/mime.types /etc/nginx/mime.types
COPY nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template
COPY --from=build /app/dist/public /usr/share/nginx/html
EXPOSE 9004
