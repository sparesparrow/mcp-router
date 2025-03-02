FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace package.json and necessary package.json files
COPY package.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build frontend
RUN npm run build --workspace=@mcp-router/frontend

# Production stage with Nginx
FROM nginx:alpine

# Copy the built app to Nginx serve directory
COPY --from=builder /app/packages/frontend/build /usr/share/nginx/html

# Copy custom Nginx config
COPY packages/frontend/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]