# Build backend
FROM python:3.11-slim AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    python3-dev \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY packages/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY packages/backend/ ./packages/backend/
COPY packages/shared/ ./packages/shared/
COPY tests/ ./tests/
COPY alembic.ini .
COPY alembic/ ./alembic/

# Set Python path
ENV PYTHONPATH=/app

# Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
RUN npm ci

# Copy source code
COPY packages/frontend/ ./packages/frontend/
COPY packages/shared/ ./packages/shared/
COPY tsconfig.json .
COPY babel.config.json .

# Build the React application
RUN npm run build

# Runtime image for frontend
FROM nginx:alpine AS frontend-runtime

COPY --from=frontend-builder /app/packages/frontend/build /usr/share/nginx/html
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Install curl for healthcheck
RUN apk add --no-cache curl

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
COPY --from=backend-builder /app/packages/shared/ ./packages/shared/
COPY --from=backend-builder /app/alembic.ini .
COPY --from=backend-builder /app/alembic/ ./alembic/

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000
ENV NODE_ENV=production

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "packages.backend.src.api.main:app", "--host", "0.0.0.0", "--port", "8000"] 