# Base image for development
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package.json files for all workspaces
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN npm ci

# Build shared package
FROM deps AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY packages/shared/ ./packages/shared/
RUN npm run build:shared

# Build frontend
FROM shared-builder AS frontend-builder
WORKDIR /app
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY packages/frontend/ ./packages/frontend/
COPY babel.config.json ./

# Set build arguments
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Build the frontend application
RUN npm run build:frontend

# Python base for backend
FROM python:3.11-slim AS backend-base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    python3-dev \
    python3-pip \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Build backend
FROM backend-base AS backend-builder
WORKDIR /app

# Copy Python dependencies
COPY packages/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Node.js packages from shared
COPY --from=shared-builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy backend code
COPY packages/backend/ ./packages/backend/
COPY tests/ ./tests/
COPY alembic.ini .
COPY alembic/ ./alembic/

# Set Python path
ENV PYTHONPATH=/app

# Runtime image for frontend
FROM nginx:alpine AS frontend-runtime
# Copy nginx configuration
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built frontend assets
COPY --from=frontend-builder /app/packages/frontend/build /usr/share/nginx/html

# Set environment variables
ENV NODE_ENV=production

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Runtime image for backend
FROM python:3.11-slim AS backend-runtime
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libjpeg62-turbo \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages and code from builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=backend-builder /app/packages/backend/ ./packages/backend/
COPY --from=shared-builder /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=backend-builder /app/alembic.ini .
COPY --from=backend-builder /app/alembic/ ./alembic/

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "packages.backend.src.api.main:app", "--host", "0.0.0.0", "--port", "8000"] 