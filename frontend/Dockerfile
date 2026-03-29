# ---- Stage 1: Build the React app ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (for faster rebuilds)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the frontend source code
COPY . .

# Build the production version of the React app
RUN npm run build

# ---- Stage 2: Serve with Nginx ----
# Use a lightweight web server to serve the built React files
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React files to Nginx's serving directory
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port 80 (standard web port)
EXPOSE 80

# Nginx starts automatically