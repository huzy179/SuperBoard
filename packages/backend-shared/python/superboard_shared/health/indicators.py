"""
Health Indicators (Python)
"""

from __future__ import annotations

import socket
import time
from typing import Any, Awaitable, Callable, Optional

from ..amqp.connection_manager import AMQPConnectionManager
from ..amqp.types import AMQPConfig
from .types import HealthIndicator, HealthStatus


class CallableHealthIndicator(HealthIndicator):
    def __init__(self, name: str, check_fn: Callable[[], Awaitable[None]]) -> None:
        super().__init__(name)
        self._check_fn = check_fn

    async def check(self) -> HealthStatus:
        start = int(time.time() * 1000)
        try:
            await self._check_fn()
            return HealthStatus(status="healthy", latency_ms=int(time.time() * 1000) - start)
        except Exception as exc:
            return HealthStatus(status="unhealthy", latency_ms=int(time.time() * 1000) - start, error=str(exc))


class RedisHealthIndicator(HealthIndicator):
    def __init__(self, name: str, *, url: str) -> None:
        super().__init__(name)
        self._url = url

    async def check(self) -> HealthStatus:
        start = int(time.time() * 1000)
        try:
            import redis.asyncio as aioredis  # type: ignore

            client = aioredis.from_url(self._url, decode_responses=True)
            try:
                pong = await client.ping()
            finally:
                await client.aclose()
            ok = pong is True or pong == "PONG"
            return HealthStatus(
                status="healthy" if ok else "unhealthy",
                latency_ms=int(time.time() * 1000) - start,
                error=None if ok else f"Unexpected ping: {pong}",
            )
        except Exception as exc:
            return HealthStatus(status="unhealthy", latency_ms=int(time.time() * 1000) - start, error=str(exc))


class RabbitMQHealthIndicator(HealthIndicator):
    def __init__(
        self,
        name: str,
        *,
        config: AMQPConfig,
        connection_manager: Optional[AMQPConnectionManager] = None,
    ) -> None:
        super().__init__(name)
        self._config = config
        self._connections = connection_manager or AMQPConnectionManager()

    async def check(self) -> HealthStatus:
        start = int(time.time() * 1000)
        try:
            conn = await self._connections.get_connection({"url": self._config.url, "reconnect_interval": 1})
            channel = await conn.channel()
            await channel.close()
            return HealthStatus(status="healthy", latency_ms=int(time.time() * 1000) - start)
        except Exception as exc:
            return HealthStatus(status="unhealthy", latency_ms=int(time.time() * 1000) - start, error=str(exc))


class GRPCHealthIndicator(HealthIndicator):
    def __init__(self, name: str, *, host: str, port: int, timeout_sec: float = 1.0) -> None:
        super().__init__(name)
        self._host = host
        self._port = port
        self._timeout = timeout_sec

    async def check(self) -> HealthStatus:
        start = int(time.time() * 1000)
        try:
            with socket.create_connection((self._host, self._port), timeout=self._timeout):
                pass
            return HealthStatus(status="healthy", latency_ms=int(time.time() * 1000) - start)
        except Exception as exc:
            return HealthStatus(status="unhealthy", latency_ms=int(time.time() * 1000) - start, error=str(exc))


class DatabaseHealthIndicator(HealthIndicator):
    def __init__(self, name: str, *, dsn: str) -> None:
        super().__init__(name)
        self._dsn = dsn

    async def check(self) -> HealthStatus:
        start = int(time.time() * 1000)
        try:
            import psycopg2  # type: ignore

            conn = psycopg2.connect(self._dsn)
            try:
                cur = conn.cursor()
                cur.execute("SELECT 1")
                cur.fetchone()
                cur.close()
            finally:
                conn.close()
            return HealthStatus(status="healthy", latency_ms=int(time.time() * 1000) - start)
        except Exception as exc:
            return HealthStatus(status="unhealthy", latency_ms=int(time.time() * 1000) - start, error=str(exc))
