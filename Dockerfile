# Use the Node alpine official image for building
FROM node:lts-alpine AS build
LABEL authors="Adeel"

# Set config to reduce noise
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

# Accept build arguments for environment variables
ARG VITE_API_BASE_URL

# Set environment variables for Vite build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Create and change to the app directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . ./

# Build the application with environment variables
RUN npm run build

# Production stage - use Caddy to serve static files
FROM caddy:2-alpine

# Copy Caddyfile first
COPY Caddyfile /etc/caddy/Caddyfile

# Copy built application from build stage
COPY --from=build /app/dist /srv

# Expose port (Railway will set this)
EXPOSE 3000

# Run Caddy with the configuration
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
