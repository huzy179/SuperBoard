"""
AI Service AMQP Event Consumer — subscribes to RabbitMQ domain events.

Uses the shared BaseAMQPConsumer (packages/backend-shared/python).
"""

from __future__ import annotations

from typing import Any, Dict, List

import bootstrap_shared  # noqa: F401
from superboard_shared.amqp import AMQPConfig, DeadLetterQueueConfig
from superboard_shared.amqp.base_consumer import BaseAMQPConsumer

from config import load_config
from services.enrichment import enrich_doc_updated, enrich_task_created, enrich_task_updated
from services.consumer_metrics import record_event_processed, record_event_dlq, record_event_failure


QUEUE_NAME = "ai.domain.events"
EXCHANGE_NAME = "superboard.domain.events"
DLX_NAME = "superboard.domain.events.dlx"
DLQ_NAME = "ai.domain.events.dlq"
BINDING_KEYS = ["task.created", "task.updated", "doc.updated"]

SUPPORTED_EVENTS = {"task.created", "task.updated", "doc.updated"}


class AIAMQPConsumer(BaseAMQPConsumer):
    def __init__(self) -> None:
        cfg = load_config()
        amqp_url = str(cfg.get("AMQP_URL", "amqp://localhost:5672"))
        prefetch = int(cfg.get("AMQP_PREFETCH_COUNT", 10))

        super().__init__(
            config=AMQPConfig(
                url=amqp_url,
                exchange=EXCHANGE_NAME,
                queue=QUEUE_NAME,
                routing_keys=BINDING_KEYS,
                prefetch_count=prefetch,
                reconnect_interval=5,
                dead_letter_exchange=DLX_NAME,
                dead_letter_queue=DLQ_NAME,
            ),
            service_name="ai-service",
            dead_letter=DeadLetterQueueConfig(
                exchange=DLX_NAME,
                queue=DLQ_NAME,
                routing_key=QUEUE_NAME,
                ttl=604800000,  # 7 days
            ),
            on_before_process=self._should_process,
            prefetch_count=prefetch,
        )

    def get_queue_name(self) -> str:
        return QUEUE_NAME

    def get_exchange_name(self) -> str:
        return EXCHANGE_NAME

    def get_binding_keys(self) -> List[str]:
        return BINDING_KEYS

    def _should_process(self, payload: Dict[str, Any], _context: Any) -> bool:
        event_type = str(payload.get("eventType") or "")
        return event_type in SUPPORTED_EVENTS

    async def process_message(self, message: Dict[str, Any], correlation_id: str) -> None:
        event_type = str(message.get("eventType") or "")
        payload = message.get("payload") or {}
        if not isinstance(payload, dict):
            raise ValueError("Invalid payload: expected object")

        try:
            if event_type == "task.created":
                await enrich_task_created(payload, correlation_id)
            elif event_type == "task.updated":
                await enrich_task_updated(payload, correlation_id)
            elif event_type == "doc.updated":
                await enrich_doc_updated(payload, correlation_id)
            else:
                raise ValueError(f"Unsupported event type: {event_type}")

            record_event_processed(event_type)
        except Exception:
            record_event_failure(event_type or "unknown")
            record_event_dlq(event_type or "unknown")
            raise
