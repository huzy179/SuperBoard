# Python AI Service with gRPC
FROM python:3.11-slim

WORKDIR /app

# Copy local Python packages that are referenced in requirements.txt via relative paths
COPY packages/backend-shared /packages/backend-shared

# Copy requirements and install dependencies
COPY apps/ai-service/requirements.txt .
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && grep -Ev '^(hypothesis|pytest|pytest-asyncio|grpcio-tools)==' requirements.txt > requirements.runtime.txt \
    && pip install --no-cache-dir -r requirements.runtime.txt \
    && apt-get purge -y --auto-remove build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY apps/ai-service .

# Expose gRPC port
EXPOSE 50051

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import socket; s=socket.create_connection(('127.0.0.1', 50051), 2); s.close()" || exit 1

CMD ["python", "grpc_server.py"]
