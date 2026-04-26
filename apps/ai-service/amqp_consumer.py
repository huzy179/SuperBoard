"""
AI Service AMQP Event Consumer — subscribes to RabbitMQ domain events.

This consumer replaces the Redis-polling EventConsumer with AMQP-based consumption
using aio-pika for robust connections with auto-reconnect.

Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any

import aio_pika
from aio_pika import ExchangeType, IncomingMessage

from services.enrichment import enrich_doc_updated, enrich_task_created, enrich_task_updated
from services.consumer_metrics import record_event_processed, record_event_dlq, record_event_failure

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s correlation_id=%(correlation_id)s %(message)s",
)
_base_logger = logging.getLogger(__name__)


def _get_logger(correlation_id: str = "unknown") -> logging.LoggerAdapter:
    return logging.LoggerAdapter(_base_logger, {"correlation_id": correlation_id})


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

QUEUE_NAME = "ai.domain.events"
EXCHANGE_NAME = "superboard.domain.events"
BINDING_KEYS = ["task.created", "task.updated", "doc.updated"]
PREFETCH_COUNT = 10

SUPPORTED_EVENTS = {"task.created", "task.updated", "doc.updated"}


# ---------------------------------------------------------------------------
# AMQPEventConsumer
# ---------------------------------------------------------------------------


class AMQPEventConsumer:
    """
    AMQP consumer for AI Service domain events using aio-pika.
    Replaces Redis-polling EventConsumer with push-based AMQP consumption.
    """

    def __init__(self, amqp_url: str | None = None) -> None:
        self._amqp_url = amqp_url or os.getenv("AMQP_URL", "amqp://localhost:5672")
        self._prefetch_count = int(os.getenv("AMQP_PREFETCH_COUNT", str(PREFETCH_COUNT)))
        self._connection: aio_pika.Connection | None = None
        self._channel: aio_pika.Channel | None = None
        self._running = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Connect to RabbitMQ and start consuming events."""
        log = _get_logger()
        log.info(f"[amqp-consumer] connecting to RabbitMQ at {self._amqp_url}")
        
        # Use connect_robust for auto-reconnect with exponential backoff
        self._connection = await aio_pika.connect_robust(
            self._amqp_url,
            reconnect_interval=5,  # exponential backoff handled by aio_pika
        )
        
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=self._prefetch_count)
        
        # Declare exchange (topic, durable)
        exchange = await self._channel.declare_exchange(
            EXCHANGE_NAME, 
            ExchangeType.TOPIC, 
            durable=True
        )
        
        # Declare queue (durable, with dead letter exchange)
        queue = await self._channel.declare_queue(
            QUEUE_NAME,
            durable=True,
            arguments={"x-dead-letter-exchange": "superboard.domain.events.dlx"},
        )
        
        # Bind queue to exchange with routing keys
        for routing_key in BINDING_KEYS:
            await queue.bind(exchange, routing_key=routing_key)
            log.info(f"[amqp-consumer] bound queue '{QUEUE_NAME}' to exchange '{EXCHANGE_NAME}' with routing key '{routing_key}'")
        
        # Start consuming
        await queue.consume(self._on_message)
        self._running = True
        
        log.info(f"[amqp-consumer] started consuming from queue '{QUEUE_NAME}' (prefetch={self._prefetch_count})")
        
        # Keep the consumer running
        while self._running:
            await asyncio.sleep(1)

    async def stop(self) -> None:
        """Stop consuming and close connections."""
        self._running = False
        if self._connection:
            await self._connection.close()
        _get_logger().info("[amqp-consumer] stopped")

    # ------------------------------------------------------------------
    # Message handling
    # ------------------------------------------------------------------

    async def _on_message(self, message: IncomingMessage) -> None:
        """
        Handle incoming AMQP message.
        Uses message.process(requeue=False) context manager for automatic ACK/NACK.
        """
        correlation_id = "unknown"
        
        try:
            # Parse message body
            event_data: dict[str, Any] = json.loads(message.body.decode())
            correlation_id = event_data.get("correlationId", "unknown")
            event_type = event_data.get("eventType", "")
            
            log = _get_logger(correlation_id)
            
            # Use message.process context manager for automatic ACK/NACK
            async with message.process(requeue=False):  # NACK with requeue=False on exception
                if event_type not in SUPPORTED_EVENTS:
                    log.info(f"[amqp-consumer] ignoring unsupported event type '{event_type}'")
                    return  # ACK (discard gracefully)
                
                log.info(f"[amqp-consumer] processing event '{event_type}'")
                
                # Process the event
                await self.process_event(event_data, correlation_id)
                
                # Record success metrics
                record_event_processed(event_type)
                
                log.info(f"[amqp-consumer] event '{event_type}' processed successfully")
                # ACK is sent automatically by context manager on success
                
        except json.JSONDecodeError as exc:
            log = _get_logger(correlation_id)
            log.error(f"[amqp-consumer] failed to parse message JSON: {exc}")
            # NACK will be sent by context manager, routing to DLQ
            record_event_dlq("malformed")
            
        except Exception as exc:
            log = _get_logger(correlation_id)
            log.error(f"[amqp-consumer] event processing failed: {exc}")
            # NACK will be sent by context manager, routing to DLQ
            event_type = "unknown"
            try:
                event_data = json.loads(message.body.decode())
                event_type = event_data.get("eventType", "unknown")
            except:
                pass
            record_event_failure(event_type)
            record_event_dlq(event_type)

    # ------------------------------------------------------------------
    # Event routing
    # ------------------------------------------------------------------

    async def process_event(self, event_data: dict[str, Any], correlation_id: str) -> None:
        """Route event to the appropriate enrichment action."""
        event_type: str = event_data.get("eventType", "")
        payload: dict[str, Any] = event_data.get("payload", {})

        if event_type == "task.created":
            await enrich_task_created(payload, correlation_id)
        elif event_type == "task.updated":
            await enrich_task_updated(payload, correlation_id)
        elif event_type == "doc.updated":
            await enrich_doc_updated(payload, correlation_id)
        else:
            raise ValueError(f"Unsupported event type: {event_type}")


# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------


async def _run() -> None:
    import signal
    
    consumer = AMQPEventConsumer()

    loop = asyncio.get_running_loop()

    def _shutdown(*_: Any) -> None:
        _get_logger().info("[amqp-consumer] shutdown signal received")
        loop.create_task(consumer.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _shutdown)

    await consumer.start()


if __name__ == "__main__":
    asyncio.run(_run())