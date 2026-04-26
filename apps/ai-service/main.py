import asyncio
import os
import socket
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

from amqp_consumer import AMQPEventConsumer

_amqp_consumer: AMQPEventConsumer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the AMQP event consumer as a background task on startup."""
    global _amqp_consumer
    _amqp_consumer = AMQPEventConsumer()
    consumer_task = asyncio.create_task(_amqp_consumer.start())
    yield
    if _amqp_consumer:
        await _amqp_consumer.stop()
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="SuperBoard AI Service", lifespan=lifespan)

# Ensure telemetry data directory exists
os.makedirs("data", exist_ok=True)

# Flag set by gRPC server startup to indicate it's running
_grpc_server_started = False

def set_grpc_started(value: bool) -> None:
    global _grpc_server_started
    _grpc_server_started = value


def _check_grpc_port() -> bool:
    """Check if the gRPC server port is listening."""
    grpc_port = int(os.getenv("GRPC_PORT", "50051"))
    grpc_host = os.getenv("GRPC_HOST", "localhost")
    try:
        with socket.create_connection((grpc_host, grpc_port), timeout=1):
            return True
    except OSError:
        return False


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "ai-service",
    }


@app.get("/ready")
def ready() -> JSONResponse:
    dependencies = []
    all_ready = True

    # Check gRPC server
    grpc_port = int(os.getenv("GRPC_PORT", "50051"))
    grpc_listening = _grpc_server_started or _check_grpc_port()
    if grpc_listening:
        dependencies.append({"name": "grpc", "status": "healthy"})
    else:
        dependencies.append({
            "name": "grpc",
            "status": "unhealthy",
            "error": f"gRPC server not listening on port {grpc_port}",
        })
        all_ready = False

    # Check model/provider config
    ai_provider = os.getenv("AI_PROVIDER", "")
    api_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
    model_ready = bool(ai_provider and api_key)
    if model_ready:
        dependencies.append({"name": "model", "status": "healthy"})
    else:
        dependencies.append({
            "name": "model",
            "status": "unhealthy",
            "error": "AI provider or API key not configured",
        })
        all_ready = False

    if all_ready:
        return JSONResponse(
            status_code=200,
            content={"status": "ready", "dependencies": dependencies},
        )

    return JSONResponse(
        status_code=503,
        content={"status": "not_ready", "dependencies": dependencies},
    )
