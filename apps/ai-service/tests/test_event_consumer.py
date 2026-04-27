"""
Unit tests for AI Service Event Consumer.
Requirements: 13.1, 13.3
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from event_consumer import EventConsumer, SUPPORTED_EVENTS, DLQ_NAME, MAX_RETRIES


class TestEventConsumerSupportedEvents:
    def test_supported_events_contains_required_types(self):
        assert "task.created" in SUPPORTED_EVENTS
        assert "task.updated" in SUPPORTED_EVENTS
        assert "doc.updated" in SUPPORTED_EVENTS

    def test_unsupported_event_is_ignored(self):
        assert "user.invited" not in SUPPORTED_EVENTS
        assert "project.updated" not in SUPPORTED_EVENTS


class TestEventConsumerProcessEvent:
    @pytest.fixture
    def consumer(self):
        c = EventConsumer(redis_url="redis://localhost:6379")
        c._redis = AsyncMock()
        return c

    @pytest.mark.asyncio
    async def test_routes_task_created_to_enrichment(self, consumer):
        event_data = {
            "eventType": "task.created",
            "correlationId": "cid-001",
            "payload": {"taskId": "t1", "title": "Test Task", "projectId": "p1",
                        "workspaceId": "w1", "creatorId": "u1"},
        }
        with patch("event_consumer.enrich_task_created", new_callable=AsyncMock) as mock_enrich:
            await consumer.process_event(event_data)
            mock_enrich.assert_called_once_with(event_data["payload"], "cid-001")

    @pytest.mark.asyncio
    async def test_routes_task_updated_to_enrichment(self, consumer):
        event_data = {
            "eventType": "task.updated",
            "correlationId": "cid-002",
            "payload": {"taskId": "t1", "projectId": "p1", "workspaceId": "w1",
                        "updatedBy": "u1", "changes": {"title": "New"}},
        }
        with patch("event_consumer.enrich_task_updated", new_callable=AsyncMock) as mock_enrich:
            await consumer.process_event(event_data)
            mock_enrich.assert_called_once_with(event_data["payload"], "cid-002")

    @pytest.mark.asyncio
    async def test_routes_doc_updated_to_enrichment(self, consumer):
        event_data = {
            "eventType": "doc.updated",
            "correlationId": "cid-003",
            "payload": {"docId": "d1", "projectId": "p1", "workspaceId": "w1",
                        "updatedBy": "u1", "changeType": "content"},
        }
        with patch("event_consumer.enrich_doc_updated", new_callable=AsyncMock) as mock_enrich:
            await consumer.process_event(event_data)
            mock_enrich.assert_called_once_with(event_data["payload"], "cid-003")

    @pytest.mark.asyncio
    async def test_raises_for_unsupported_event_type(self, consumer):
        event_data = {"eventType": "unknown.event", "correlationId": "cid-x", "payload": {}}
        with pytest.raises(ValueError, match="Unsupported event type"):
            await consumer.process_event(event_data)


class TestEventConsumerRetryAndDLQ:
    @pytest.fixture
    def consumer(self):
        c = EventConsumer(redis_url="redis://localhost:6379")
        c._redis = AsyncMock()
        return c

    @pytest.mark.asyncio
    async def test_succeeds_on_first_attempt(self, consumer):
        event_data = {
            "eventType": "task.created",
            "correlationId": "cid-ok",
            "payload": {"taskId": "t1", "title": "T", "projectId": "p1",
                        "workspaceId": "w1", "creatorId": "u1"},
        }
        with patch("event_consumer.enrich_task_created", new_callable=AsyncMock):
            await consumer._process_with_retry(event_data, "job-1", "cid-ok")
        # DLQ should NOT be called
        consumer._redis.rpush.assert_not_called()

    @pytest.mark.asyncio
    async def test_moves_to_dlq_after_max_retries(self, consumer):
        event_data = {
            "eventType": "task.created",
            "correlationId": "cid-fail",
            "payload": {},
        }
        with patch("event_consumer.enrich_task_created", new_callable=AsyncMock,
                   side_effect=RuntimeError("boom")):
            with patch("asyncio.sleep", new_callable=AsyncMock):
                await consumer._process_with_retry(event_data, "job-fail", "cid-fail")

        consumer._redis.rpush.assert_called_once()
        call_args = consumer._redis.rpush.call_args
        assert call_args[0][0] == DLQ_NAME
        dlq_entry = json.loads(call_args[0][1])
        assert dlq_entry["jobId"] == "job-fail"
        assert "boom" in dlq_entry["error"]

    @pytest.mark.asyncio
    async def test_retries_correct_number_of_times(self, consumer):
        call_count = 0

        async def failing_enrich(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise RuntimeError("transient error")

        event_data = {
            "eventType": "task.created",
            "correlationId": "cid-retry",
            "payload": {},
        }
        with patch("event_consumer.enrich_task_created", side_effect=failing_enrich):
            with patch("asyncio.sleep", new_callable=AsyncMock):
                await consumer._process_with_retry(event_data, "job-retry", "cid-retry")

        assert call_count == MAX_RETRIES

    @pytest.mark.asyncio
    async def test_succeeds_on_second_attempt(self, consumer):
        attempt = 0

        async def flaky_enrich(*args, **kwargs):
            nonlocal attempt
            attempt += 1
            if attempt < 2:
                raise RuntimeError("transient")

        event_data = {
            "eventType": "task.created",
            "correlationId": "cid-flaky",
            "payload": {"taskId": "t1", "title": "T", "projectId": "p1",
                        "workspaceId": "w1", "creatorId": "u1"},
        }
        with patch("event_consumer.enrich_task_created", side_effect=flaky_enrich):
            with patch("asyncio.sleep", new_callable=AsyncMock):
                await consumer._process_with_retry(event_data, "job-flaky", "cid-flaky")

        # Should NOT go to DLQ since it eventually succeeded
        consumer._redis.rpush.assert_not_called()


class TestEventConsumerHandleJob:
    @pytest.fixture
    def consumer(self):
        c = EventConsumer(redis_url="redis://localhost:6379")
        c._redis = AsyncMock()
        return c

    @pytest.mark.asyncio
    async def test_ignores_unsupported_event_type(self, consumer):
        job_data = {
            "eventType": "user.invited",
            "correlationId": "cid-x",
            "payload": {},
        }
        consumer._redis.hgetall = AsyncMock(return_value={"data": json.dumps(job_data)})
        # Should not raise and should not call DLQ
        await consumer._handle_job("job-unsupported")
        consumer._redis.rpush.assert_not_called()

    @pytest.mark.asyncio
    async def test_skips_missing_job(self, consumer):
        consumer._redis.hgetall = AsyncMock(return_value={})
        await consumer._handle_job("job-missing")
        consumer._redis.rpush.assert_not_called()
