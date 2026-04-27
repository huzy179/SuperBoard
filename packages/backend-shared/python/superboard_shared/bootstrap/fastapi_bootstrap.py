"""
FastAPI Bootstrap Utilities (Python)

Provides a small bootstrap helper for FastAPI services to standardize:
- correlation id propagation
- basic logging format hooks (optional)
- graceful shutdown hooks
"""

from __future__ import annotations

import contextvars
import logging
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional


correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "correlation_id", default="unknown"
)


def get_correlation_id() -> str:
    return correlation_id_var.get()


def correlation_id_middleware(app: Any) -> None:
    """
    Install a middleware that reads/writes `x-correlation-id` header.

    This function expects `fastapi.FastAPI` and only imports FastAPI/Starlette at runtime.
    """

    try:
        from starlette.middleware.base import BaseHTTPMiddleware
        from starlette.requests import Request
        from starlette.responses import Response
    except Exception as exc:  # pragma: no cover
        raise RuntimeError("FastAPI/Starlette not available for bootstrap") from exc

    class _CorrelationIdMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]):
            cid = request.headers.get("x-correlation-id") or request.headers.get("x-request-id")
            token = correlation_id_var.set(cid or "unknown")
            try:
                response = await call_next(request)
                response.headers["x-correlation-id"] = get_correlation_id()
                return response
            finally:
                correlation_id_var.reset(token)

    app.add_middleware(_CorrelationIdMiddleware)


@dataclass(frozen=True)
class ServiceInfo:
    name: str
    version: str
    description: Optional[str] = None


class FastAPIBootstrap:
    @staticmethod
    def create_app(
        service: ServiceInfo,
        *,
        title: Optional[str] = None,
        install_correlation_id: bool = True,
        configure_logging: bool = True,
    ):
        """
        Create a FastAPI app with optional standardized middleware.
        """

        try:
            from fastapi import FastAPI
        except Exception as exc:  # pragma: no cover
            raise RuntimeError("fastapi is required for FastAPIBootstrap") from exc

        if configure_logging:
            logging.basicConfig(
                level=logging.INFO,
                format="%(asctime)s %(levelname)s %(name)s correlation_id=%(correlation_id)s %(message)s",
            )

        app = FastAPI(
            title=title or service.name,
            version=service.version,
            description=service.description,
        )

        if install_correlation_id:
            correlation_id_middleware(app)

        return app

