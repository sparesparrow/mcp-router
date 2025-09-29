FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY packages/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY packages/backend/ ./packages/backend/

# Python configuration
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI with Uvicorn
CMD ["python", "-m", "uvicorn", "packages.backend.src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]