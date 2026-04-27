"""
AMQP Connection Manager (Python)

Provides cached robust connections for aio-pika based consumers.
"""

from __future__ import annotations

import asyncio
from typing import Any, Dict

import aio_pika


class AMQPConnectionManager:
    """
    AMQP Connection Manager class.

    - Caches connections per URL
    - Deduplicates concurrent connection attempts
    - Provides close_all() cleanup
    """
    
    def __init__(self):
        self._connections: dict[str, aio_pika.RobustConnection] = {}
        self._pending: dict[str, asyncio.Future[aio_pika.RobustConnection]] = {}
    
    async def get_connection(self, config: Dict[str, Any]):
        """Get or create a robust AMQP connection for the given config."""
        url = str(config.get("url") or "")
        if not url:
            raise ValueError("AMQP config missing 'url'")

        existing = self._connections.get(url)
        if existing and not existing.is_closed:
            return existing

        pending = self._pending.get(url)
        if pending:
            return await pending

        loop = asyncio.get_running_loop()
        fut: asyncio.Future[aio_pika.RobustConnection] = loop.create_future()
        self._pending[url] = fut
        try:
            reconnect_interval = int(config.get("reconnect_interval") or 5)
            conn = await aio_pika.connect_robust(url, reconnect_interval=reconnect_interval)
            self._connections[url] = conn
            fut.set_result(conn)
            return conn
        except Exception as exc:
            fut.set_exception(exc)
            raise
        finally:
            self._pending.pop(url, None)
    
    async def close_all(self) -> None:
        """Close all cached connections."""
        conns = list(self._connections.values())
        self._connections.clear()

        for conn in conns:
            try:
                await conn.close()
            except Exception:
                pass
