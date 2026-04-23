# Stage 1 — Build Angular app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2 — Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/simovite-frontend/browser /usr/share/nginx/html

# Nginx config for Angular routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
