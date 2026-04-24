"""
Unit tests for Correlation ID logging in AI Service gRPC server.
Requirements: 6.4, 6.5, 6.6
"""
import logging
from unittest.mock import MagicMock

import pytest

from grpc_server import _extract_correlation_id, get_logger, CorrelationLoggerAdapter


class TestExtractCorrelationId:
    def _make_context(self, metadata: list):
        ctx = MagicMock()
        ctx.invocation_metadata.return_value = metadata
        return ctx

    def test_extracts_correlation_id_from_metadata(self):
        ctx = self._make_context([("correlation-id", "abc-123"), ("other", "val")])
        assert _extract_correlation_id(ctx) == "abc-123"

    def test_returns_unknown_when_header_missing(self):
        ctx = self._make_context([("other-key", "value")])
        assert _extract_correlation_id(ctx) == "unknown"

    def test_returns_unknown_when_metadata_empty(self):
        ctx = self._make_context([])
        assert _extract_correlation_id(ctx) == "unknown"

    def test_returns_unknown_when_invocation_metadata_raises(self):
        ctx = MagicMock()
        ctx.invocation_metadata.side_effect = Exception("grpc error")
        assert _extract_correlation_id(ctx) == "unknown"

    def test_handles_multiple_metadata_entries(self):
        ctx = self._make_context([
            ("authorization", "Bearer token"),
            ("correlation-id", "trace-xyz"),
            ("content-type", "application/grpc"),
        ])
        assert _extract_correlation_id(ctx) == "trace-xyz"


class TestCorrelationLoggerAdapter:
    def test_get_logger_returns_adapter(self):
        log = get_logger("test-cid-001")
        assert isinstance(log, CorrelationLoggerAdapter)

    def test_log_record_includes_correlation_id(self):
        records = []

        class CapturingHandler(logging.Handler):
            def emit(self, record):
                records.append(record)

        base_logger = logging.getLogger("test_correlation_logger")
        base_logger.addHandler(CapturingHandler())
        base_logger.setLevel(logging.DEBUG)

        adapter = CorrelationLoggerAdapter(base_logger, {"correlation_id": "cid-999"})
        adapter.info("test message")

        assert len(records) == 1
        assert records[0].correlation_id == "cid-999"

    def test_log_record_uses_unknown_when_no_cid(self):
        records = []

        class CapturingHandler(logging.Handler):
            def emit(self, record):
                records.append(record)

        base_logger = logging.getLogger("test_no_cid_logger")
        base_logger.addHandler(CapturingHandler())
        base_logger.setLevel(logging.DEBUG)

        adapter = CorrelationLoggerAdapter(base_logger, {})
        adapter.warning("no cid message")

        assert len(records) == 1
        assert records[0].correlation_id == "unknown"
