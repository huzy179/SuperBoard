"""
Base AMQP Consumer (Python)

Async AMQP consumer using aio-pika with:
- Robust connection management
- Correlation ID propagation
- Optional DLQ publish with preserved error + original message metadata
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import random
import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Callable

import aio_pika
from aio_pika import ExchangeType, IncomingMessage

from .connection_manager import AMQPConnectionManager
from .types import AMQPConfig, DeadLetterQueueConfig, MessageProcessingContext


class BaseAMQPConsumer(ABC):
    """
    Base AMQP Consumer class.

    Subclasses should override:
    - get_queue_name()
    - get_exchange_name()
    - get_binding_keys()
    - process_message()
    """

    def __init__(
        self,
        config: AMQPConfig,
        service_name: str,
        connection_manager: Optional[AMQPConnectionManager] = None,
        dead_letter: Optional[DeadLetterQueueConfig] = None,
        exchange_type: ExchangeType = ExchangeType.TOPIC,
        prefetch_count: Optional[int] = None,
        logger: Optional[logging.Logger] = None,
        on_before_process: Optional[Callable[[dict[str, Any], MessageProcessingContext], bool]] = None,
        max_reconnect_attempts: int = 10,
        base_reconnect_delay_sec: float = 1.0,
        max_reconnect_delay_sec: float = 30.0,
    ) -> None:
        self._config = config
        self._service_name = service_name
        self._connection_manager = connection_manager or AMQPConnectionManager()
        self._dead_letter = dead_letter
        self._exchange_type = exchange_type
        self._prefetch_count = prefetch_count or config.prefetch_count or 10
        self._logger = logger or logging.getLogger(f"{service_name}.amqp_consumer")
        self._on_before_process = on_before_process

        self._max_reconnect_attempts = max_reconnect_attempts
        self._base_reconnect_delay_sec = base_reconnect_delay_sec
        self._max_reconnect_delay_sec = max_reconnect_delay_sec

        self._running = False
        self._consumer_task: Optional[asyncio.Task[None]] = None
        self._connection: Optional[aio_pika.RobustConnection] = None
        self._channel: Optional[aio_pika.abc.AbstractChannel] = None
        self._queue: Optional[aio_pika.abc.AbstractQueue] = None
    
    @abstractmethod
    def get_queue_name(self) -> str:
        """Get the queue name for this consumer"""
        raise NotImplementedError
    
    @abstractmethod
    def get_exchange_name(self) -> str:
        """Get the exchange name for this consumer"""
        raise NotImplementedError
    
    @abstractmethod
    def get_binding_keys(self) -> List[str]:
        """Get the routing keys for this consumer"""
        raise NotImplementedError
    
    @abstractmethod
    async def process_message(self, message: Dict[str, Any], correlation_id: str) -> None:
        """Process a message from the queue"""
        raise NotImplementedError

    async def start(self) -> None:
        """Connect to RabbitMQ and start consuming messages."""
        self._running = True
        self._consumer_task = asyncio.create_task(self._run_loop())
        await asyncio.sleep(0)  # allow task to start

    async def stop(self) -> None:
        """Stop consuming and close channel/connection."""
        self._running = False
        if self._consumer_task:
            self._consumer_task.cancel()
            try:
                await self._consumer_task
            except asyncio.CancelledError:
                pass
            self._consumer_task = None

        if self._channel:
            try:
                await self._channel.close()
            except Exception:
                pass
            self._channel = None

        if self._connection:
            try:
                await self._connection.close()
            except Exception:
                pass
            self._connection = None

    async def _run_loop(self) -> None:
        attempts = 0
        while self._running:
            try:
                await self._connect_and_consume()
                # Consumption is event-driven; keep loop alive.
                while self._running:
                    await asyncio.sleep(1)
            except asyncio.CancelledError:
                return
            except Exception as exc:
                attempts += 1
                if attempts >= self._max_reconnect_attempts:
                    self._logger.error(
                        "[amqp] max reconnect attempts reached (%s): %s",
                        self._max_reconnect_attempts,
                        exc,
                    )
                    return

                delay = min(
                    self._base_reconnect_delay_sec * (2 ** (attempts - 1)) + random.random(),
                    self._max_reconnect_delay_sec,
                )
                self._logger.warning(
                    "[amqp] consume loop error; reconnecting in %.2fs (attempt %s/%s): %s",
                    delay,
                    attempts,
                    self._max_reconnect_attempts,
                    exc,
                )
                await self._safe_close()
                await asyncio.sleep(delay)

    async def _safe_close(self) -> None:
        try:
            if self._channel:
                await self._channel.close()
        except Exception:
            pass
        self._channel = None

        try:
            if self._connection:
                await self._connection.close()
        except Exception:
            pass
        self._connection = None

    async def _connect_and_consume(self) -> None:
        url_config: dict[str, Any] = {
            "url": self._config.url,
            "reconnect_interval": self._config.reconnect_interval or 5,
        }
        self._connection = await self._connection_manager.get_connection(url_config)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=int(self._prefetch_count))

        exchange_name = self.get_exchange_name() or self._config.exchange
        queue_name = self.get_queue_name() or self._config.queue
        binding_keys = self.get_binding_keys() or self._config.routing_keys

        exchange = await self._channel.declare_exchange(
            exchange_name,
            self._exchange_type,
            durable=True,
        )

        queue_args: dict[str, Any] = {}
        if self._dead_letter:
            queue_args["x-dead-letter-exchange"] = self._dead_letter.exchange

        self._queue = await self._channel.declare_queue(
            queue_name,
            durable=True,
            arguments=queue_args or None,
        )

        for key in binding_keys:
            await self._queue.bind(exchange, routing_key=key)

        if self._dead_letter:
            dlx = await self._channel.declare_exchange(self._dead_letter.exchange, ExchangeType.TOPIC, durable=True)
            dlq = await self._channel.declare_queue(
                self._dead_letter.queue,
                durable=True,
                arguments={"x-message-ttl": self._dead_letter.ttl} if self._dead_letter.ttl else None,
            )
            await dlq.bind(dlx, routing_key=self._dead_letter.routing_key)

        await self._queue.consume(self._on_message)
        self._logger.info("[amqp] consuming queue='%s' exchange='%s'", queue_name, exchange_name)

    async def _on_message(self, message: IncomingMessage) -> None:
        correlation_id = (
            message.correlation_id
            or message.message_id
            or (message.headers or {}).get("x-correlation-id")
            or f"corr_{int(time.time() * 1000)}_{random.randint(0, 1_000_000)}"
        )

        context = MessageProcessingContext(
            correlation_id=str(correlation_id),
            timestamp=datetime.now(timezone.utc),
            retry_count=int((message.headers or {}).get("x-retry-count") or 0),
            start_time=time.time(),
        )

        async with message.process(requeue=False):
            try:
                payload = json.loads(message.body.decode("utf-8"))
            except Exception as exc:
                await self._publish_dlq(message, context, exc)
                raise

            if self._on_before_process:
                try:
                    should = self._on_before_process(payload, context)
                    if not should:
                        return
                except Exception:
                    # If filter fails, treat as processing failure.
                    await self._publish_dlq(message, context, Exception("on_before_process failed"))
                    raise

            try:
                await self.process_message(payload, str(correlation_id))
            except Exception as exc:
                await self._publish_dlq(message, context, exc)
                raise

    async def _publish_dlq(self, message: IncomingMessage, context: MessageProcessingContext, error: Exception) -> None:
        if not self._dead_letter or not self._channel:
            return

        try:
            dlx = await self._channel.declare_exchange(
                self._dead_letter.exchange, ExchangeType.TOPIC, durable=True
            )
            context_dict = {
                "correlation_id": context.correlation_id,
                "timestamp": context.timestamp.isoformat(),
                "retry_count": context.retry_count,
                "start_time": context.start_time,
            }
            body = {
                "error": {"message": str(error), "name": error.__class__.__name__},
                "context": {
                    **context_dict,
                    "original_message": {
                        "content_base64": base64.b64encode(message.body).decode("ascii"),
                        "headers": message.headers or {},
                        "routing_key": message.routing_key,
                        "exchange": getattr(message.exchange, "name", None) or str(message.exchange),
                    },
                },
            }
            await dlx.publish(
                aio_pika.Message(
                    body=json.dumps(body).encode("utf-8"),
                    content_type="application/json",
                    correlation_id=str(context.correlation_id),
                    headers={
                        "x-original-routing-key": message.routing_key,
                        "x-dead-lettered-by": self._service_name,
                    },
                ),
                routing_key=self._dead_letter.routing_key,
            )
        except Exception as exc:
            self._logger.error("[amqp] failed to publish DLQ message: %s", exc)
