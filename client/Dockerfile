# Stage 1: Build application
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Clean dependency installation
# TODO: Clean npm ci after removing vite-tsconfig-paths in favor of Vite 8 native tsconfig resolution
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code and config files
COPY . .

# Build arguments for Vite env variables if needed
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build production assets
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:1.27-alpine AS production

# Remove default nginx html and default server config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
