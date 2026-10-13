# Build with the exact dependencies that were tested (Annex H, rule 6: npm ci).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Where the container publishes its remoteEntry.js: /remoteEntry.js on the platform (one origin,
# ADR-017). Required: without it the portal would look for the shell on localhost (R-24).
ARG VITE_SHELL_URL
RUN : "${VITE_SHELL_URL:?build with --build-arg VITE_SHELL_URL (e.g. /remoteEntry.js)}"
ENV VITE_SHELL_URL=$VITE_SHELL_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
