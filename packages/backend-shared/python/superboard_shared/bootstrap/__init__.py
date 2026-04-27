"""
Service Bootstrap Utilities (Python)

Provides service bootstrap utility for consistent service initialization
and graceful shutdown handling.
"""

from .fastapi_bootstrap import FastAPIBootstrap, ServiceInfo, get_correlation_id

__all__ = [
    "FastAPIBootstrap",
    "ServiceInfo",
    "get_correlation_id",
]
