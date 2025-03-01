# Stage 1: Build
FROM python:3.11-slim as backend-builder
WORKDIR /app

# Install build dependencies and required packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    python3-dev \
    python3-pip \
    python3-setuptools && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY ../services/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and config files
COPY ../services/ ./services/
COPY ../alembic.ini .
COPY ../alembic/ ./alembic/

# Stage 2: Runtime
FROM python:3.11-slim as backend-runtime
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=backend-builder /app/services/ ./services/
COPY --from=backend-builder /app/alembic.ini .
COPY --from=backend-builder /app/alembic/ ./alembic/

# Expose the application port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run Uvicorn
CMD ["uvicorn", "services.main:app", "--host", "0.0.0.0", "--port", "8000"] 