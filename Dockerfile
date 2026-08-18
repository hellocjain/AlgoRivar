# Multi-stage Dockerfile for AlgoRivar SaaS Platform
# Stage 1: Frontend Build (Node.js 22)
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Backend (Python 3.12 Slim)
FROM python:3.12-slim AS runner

WORKDIR /app

# System dependencies for cryptography, build-tools, and SQLite/PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir psycopg2-binary redis gunicorn eventlet

# Copy Backend Source
COPY . /app

# Copy Built Frontend Assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose Web Port (5001) and WebSocket Proxy Port (8765)
EXPOSE 5001 8765

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/auth/app-info || exit 1

# Start AlgoRivar App
CMD ["python3", "app.py"]
