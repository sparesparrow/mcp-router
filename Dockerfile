FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json files
COPY package.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build packages
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/backend/package.json ./packages/backend/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Install production dependencies only
ENV NODE_ENV=production
RUN npm install --production

# Expose backend port
EXPOSE 3001

# Start backend server
CMD ["npm", "run", "start", "--workspace=@mcp-router/backend"]