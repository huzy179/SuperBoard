"""
Consumer metrics for the AI Service Event Consumer.

Exposes Prometheus metrics for:
  - events_processed_total{event_type, status}  — events processed (success/dlq)
  - events_failed_total{event_type}             — events routed to DLQ
  - event_dlq_depth                             — current DLQ depth (polled)
  - rabbitmq_consume_total{service, event_type, status} — RabbitMQ consumption metrics

Requirements: 13.4, 9.3
"""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prometheus metrics (optional — gracefully disabled if prom_client not installed)
# ---------------------------------------------------------------------------

try:
    from prometheus_client import Counter, Gauge, start_http_server as _prom_start

    _events_processed = Counter(
        "ai_events_processed_total",
        "Total domain events processed by the AI event consumer",
        ["event_type", "status"],
    )
    _events_failed = Counter(
        "ai_events_failed_total",
        "Total domain events routed to DLQ by the AI event consumer",
        ["event_type"],
    )
    _dlq_depth = Gauge(
        "ai_event_dlq_depth",
        "Current number of events in the AI service domain-events DLQ",
    )
    _rabbitmq_consume_total = Counter(
        "rabbitmq_consume_total",
        "Total RabbitMQ events consumed by service",
        ["service", "event_type", "status"],
    )
    _PROM_AVAILABLE = True
except ImportError:
    _PROM_AVAILABLE = False
    logger.warning("[consumer_metrics] prometheus_client not installed — metrics disabled")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def record_event_processed(event_type: str) -> None:
    """Increment the processed counter with status=success."""
    if _PROM_AVAILABLE:
        _events_processed.labels(event_type=event_type, status="success").inc()
        _rabbitmq_consume_total.labels(service="ai", event_type=event_type, status="success").inc()


def record_event_dlq(event_type: str) -> None:
    """Increment the processed counter with status=dlq and the failed counter."""
    if _PROM_AVAILABLE:
        _events_processed.labels(event_type=event_type, status="dlq").inc()
        _events_failed.labels(event_type=event_type).inc()
        _rabbitmq_consume_total.labels(service="ai", event_type=event_type, status="dlq").inc()


def record_event_failure(event_type: str) -> None:
    """Record event processing failure (before DLQ)."""
    if _PROM_AVAILABLE:
        _rabbitmq_consume_total.labels(service="ai", event_type=event_type, status="failure").inc()


def set_dlq_depth(depth: int) -> None:
    """Set the current DLQ depth gauge."""
    if _PROM_AVAILABLE:
        _dlq_depth.set(depth)


def start_metrics_server(port: int | None = None) -> None:
    """Start the Prometheus HTTP metrics server on the configured port."""
    if not _PROM_AVAILABLE:
        return
    metrics_port = port or int(os.getenv("METRICS_PORT", "9090"))
    try:
        _prom_start(metrics_port)
        logger.info(f"[consumer_metrics] Prometheus metrics server started on port {metrics_port}")
    except Exception as exc:
        logger.warning(f"[consumer_metrics] Failed to start metrics server: {exc}")
