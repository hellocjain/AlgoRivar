# Ultra-Fast Production Dockerfile for AlgoRivar SaaS Platform
# Uses pre-built frontend/dist and binary wheels for sub-60s builds on 1-vCPU servers
FROM python:3.12-slim AS runner

WORKDIR /app

# System dependencies for healthcheck and runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies using fast binary wheels
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir psycopg2-binary redis gunicorn eventlet

# Copy Application Source (includes pre-built frontend/dist)
COPY . /app

# Expose Web Port (5001) and WebSocket Proxy Port (8765)
EXPOSE 5001 8765

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/auth/app-info || exit 1

# Start AlgoRivar App
CMD ["python3", "app.py"]
