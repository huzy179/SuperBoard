import asyncio
import os
import socket
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from dataclasses import asdict

import bootstrap_shared  # noqa: F401
from superboard_shared.bootstrap.fastapi_bootstrap import FastAPIBootstrap, ServiceInfo
from superboard_shared.health import CallableHealthIndicator, HealthCheckService

from amqp_consumer import AIAMQPConsumer
from config import load_config

_amqp_consumer: AIAMQPConsumer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the AMQP event consumer as a background task on startup."""
    global _amqp_consumer
    _amqp_consumer = AIAMQPConsumer()
    await _amqp_consumer.start()
    yield
    if _amqp_consumer:
        await _amqp_consumer.stop()


app = FastAPIBootstrap.create_app(
    ServiceInfo(name="ai-service", version=os.getenv("npm_package_version", "0.1.0")),
    title="SuperBoard AI Service",
)
app.router.lifespan_context = lifespan  # type: ignore[attr-defined]

# Ensure telemetry data directory exists
os.makedirs("data", exist_ok=True)

# Flag set by gRPC server startup to indicate it's running
_grpc_server_started = False

def set_grpc_started(value: bool) -> None:
    global _grpc_server_started
    _grpc_server_started = value


def _check_grpc_port() -> bool:
    """Check if the gRPC server port is listening."""
    cfg = load_config()
    grpc_port = int(cfg.get("GRPC_PORT", 50051))
    grpc_host = str(cfg.get("GRPC_HOST", "localhost"))
    try:
        with socket.create_connection((grpc_host, grpc_port), timeout=1):
            return True
    except OSError:
        return False


_health = HealthCheckService(
    service="ai-service",
    version=os.getenv("npm_package_version", "0.1.0"),
)


async def _grpc_ready() -> None:
    cfg = load_config()
    grpc_port = int(cfg.get("GRPC_PORT", 50051))
    if _grpc_server_started or _check_grpc_port():
        return
    raise RuntimeError(f"gRPC server not listening on port {grpc_port}")


async def _model_ready() -> None:
    cfg = load_config()
    ai_provider = str(cfg.get("AI_PROVIDER", "")).strip()
    api_key = (str(cfg.get("GEMINI_API_KEY", "")) or str(cfg.get("OPENAI_API_KEY", ""))).strip()
    if ai_provider and api_key:
        return
    raise RuntimeError("AI provider or API key not configured")


_health.register_indicator(CallableHealthIndicator("grpc", _grpc_ready))
_health.register_indicator(CallableHealthIndicator("model", _model_ready))


@app.get("/health")
def health() -> dict:
    return asdict(_health.check_health())


@app.get("/ready")
async def ready() -> JSONResponse:
    result = await _health.check_readiness()
    all_healthy = all(d.status == "healthy" for d in result.dependencies)
    return JSONResponse(status_code=200 if all_healthy else 503, content=asdict(result))
