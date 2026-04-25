"""
AI Service Event Consumer — subscribes to the BullMQ "domain-events" queue via Redis.

BullMQ stores jobs in Redis keys:
  bull:{queueName}:wait   — list of job IDs waiting to be processed
  bull:{queueName}:{id}   — hash with job fields (name, data, opts, ...)

This consumer polls the wait list, processes events, and implements:
  - Retry with exponential backoff (max 3 attempts, base delay 1s)
  - DLQ: after max retries → push to "domain-events:failed" list

Requirements: 13.1, 13.3
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import signal
import time
from typing import Any

import redis.asyncio as aioredis

from services.enrichment import enrich_doc_updated, enrich_task_created, enrich_task_updated
from services.consumer_metrics import record_event_processed, record_event_dlq, set_dlq_depth

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

QUEUE_NAME = "domain-events"
DLQ_NAME = "domain-events:failed"
BULL_WAIT_KEY = f"bull:{QUEUE_NAME}:wait"
BULL_JOB_PREFIX = f"bull:{QUEUE_NAME}:"

MAX_RETRIES = int(os.getenv("EVENT_CONSUMER_MAX_RETRIES", "3"))
BASE_DELAY_SECONDS = float(os.getenv("EVENT_CONSUMER_BASE_DELAY_S", "1.0"))
POLL_INTERVAL_SECONDS = float(os.getenv("EVENT_CONSUMER_POLL_INTERVAL_S", "1.0"))

SUPPORTED_EVENTS = {"task.created", "task.updated", "doc.updated"}


# ---------------------------------------------------------------------------
# EventConsumer
# ---------------------------------------------------------------------------


class EventConsumer:
    """
    Polls the BullMQ "domain-events" queue and dispatches events to enrichment handlers.
    """

    def __init__(self, redis_url: str | None = None) -> None:
        self._redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self._redis: aioredis.Redis | None = None
        self._running = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Connect to Redis and begin polling."""
        self._redis = aioredis.from_url(self._redis_url, decode_responses=True)
        self._running = True
        log = _get_logger()
        log.info(f"[consumer] connected to Redis at {self._redis_url}")
        log.info(f"[consumer] polling queue '{QUEUE_NAME}' (max_retries={MAX_RETRIES})")
        await self._poll_loop()

    async def stop(self) -> None:
        """Signal the poll loop to stop and close the Redis connection."""
        self._running = False
        if self._redis:
            await self._redis.aclose()
        _get_logger().info("[consumer] stopped")

    # ------------------------------------------------------------------
    # Poll loop
    # ------------------------------------------------------------------

    async def _poll_loop(self) -> None:
        poll_count = 0
        while self._running:
            try:
                job_id = await self._redis.lpop(BULL_WAIT_KEY)  # type: ignore[union-attr]
                if job_id:
                    await self._handle_job(job_id)
                else:
                    await asyncio.sleep(POLL_INTERVAL_SECONDS)
                # Update DLQ depth every ~30 polls
                poll_count += 1
                if poll_count % 30 == 0:
                    try:
                        depth = await self._redis.llen(DLQ_NAME)  # type: ignore[union-attr]
                        set_dlq_depth(depth)
                    except Exception:
                        pass
            except Exception as exc:
                _get_logger().error(f"[consumer] poll loop error: {exc}")
                await asyncio.sleep(POLL_INTERVAL_SECONDS)

    # ------------------------------------------------------------------
    # Job handling
    # ------------------------------------------------------------------

    async def _handle_job(self, job_id: str) -> None:
        """Fetch job data from Redis hash and process it with retry logic."""
        job_key = f"{BULL_JOB_PREFIX}{job_id}"
        raw = await self._redis.hgetall(job_key)  # type: ignore[union-attr]
        if not raw:
            _get_logger().warning(f"[consumer] job {job_id} not found in Redis, skipping")
            return

        # Parse job data
        try:
            event_data: dict[str, Any] = json.loads(raw.get("data", "{}"))
        except json.JSONDecodeError as exc:
            _get_logger().error(f"[consumer] failed to parse job {job_id} data: {exc}")
            return

        correlation_id: str = event_data.get("correlationId", "unknown")
        log = _get_logger(correlation_id)
        event_type: str = event_data.get("eventType", "")

        if event_type not in SUPPORTED_EVENTS:
            log.info(f"[consumer] ignoring unsupported event type '{event_type}' (job={job_id})")
            return

        log.info(f"[consumer] processing event '{event_type}' (job={job_id})")
        await self._process_with_retry(event_data, job_id, correlation_id)

    async def _process_with_retry(
        self,
        event_data: dict[str, Any],
        job_id: str,
        correlation_id: str,
    ) -> None:
        """
        Attempt to process the event up to MAX_RETRIES times with exponential backoff.
        On exhaustion, push the event to the DLQ.
        """
        log = _get_logger(correlation_id)
        last_exc: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                await self.process_event(event_data)
                log.info(
                    f"[consumer] event '{event_data.get('eventType')}' processed successfully "
                    f"(job={job_id}, attempt={attempt})"
                )
                record_event_processed(event_data.get("eventType", "unknown"))
                return
            except Exception as exc:
                last_exc = exc
                delay = BASE_DELAY_SECONDS * (2 ** (attempt - 1))
                log.warning(
                    f"[consumer] attempt {attempt}/{MAX_RETRIES} failed for job={job_id}: {exc}. "
                    f"Retrying in {delay:.1f}s"
                )
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(delay)

        # All retries exhausted → DLQ
        log.error(
            f"[consumer] job={job_id} exhausted {MAX_RETRIES} retries. "
            f"Moving to DLQ '{DLQ_NAME}'. Last error: {last_exc}"
        )
        await self._move_to_dlq(event_data, job_id, str(last_exc))
        record_event_dlq(event_data.get("eventType", "unknown"))

    # ------------------------------------------------------------------
    # Event routing
    # ------------------------------------------------------------------

    async def process_event(self, event_data: dict[str, Any]) -> None:
        """Route event to the appropriate enrichment action."""
        event_type: str = event_data.get("eventType", "")
        payload: dict[str, Any] = event_data.get("payload", {})
        correlation_id: str = event_data.get("correlationId", "unknown")

        if event_type == "task.created":
            await enrich_task_created(payload, correlation_id)
        elif event_type == "task.updated":
            await enrich_task_updated(payload, correlation_id)
        elif event_type == "doc.updated":
            await enrich_doc_updated(payload, correlation_id)
        else:
            raise ValueError(f"Unsupported event type: {event_type}")

    # ------------------------------------------------------------------
    # DLQ
    # ------------------------------------------------------------------

    async def _move_to_dlq(
        self,
        event_data: dict[str, Any],
        job_id: str,
        error_message: str,
    ) -> None:
        """Push the failed event to the dead-letter queue list."""
        dlq_entry = json.dumps(
            {
                "jobId": job_id,
                "event": event_data,
                "error": error_message,
                "failedAt": _iso_now(),
            }
        )
        await self._redis.rpush(DLQ_NAME, dlq_entry)  # type: ignore[union-attr]
        _get_logger(event_data.get("correlationId", "unknown")).info(
            f"[consumer] job={job_id} pushed to DLQ '{DLQ_NAME}'"
        )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _iso_now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------


async def _run() -> None:
    consumer = EventConsumer()

    loop = asyncio.get_running_loop()

    def _shutdown(*_: Any) -> None:
        _get_logger().info("[consumer] shutdown signal received")
        loop.create_task(consumer.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _shutdown)

    await consumer.start()


if __name__ == "__main__":
    asyncio.run(_run())
