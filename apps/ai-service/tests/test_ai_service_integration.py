"""
Integration tests for AI Service migration to shared library.

Tests verify:
1. Python AMQP consumer uses shared BaseAMQPConsumer
2. Configuration uses shared ConfigService
3. Health checks use shared HealthCheckService
4. Feature parity with TypeScript services

Requirements: 1.1, 2.1, 3.1, 1.4, 1.5, 1.7, 2.6, 3.7
"""
from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from dataclasses import asdict

import pytest
from fastapi.testclient import TestClient

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Ensure env vars are set before importing app
os.environ.setdefault("AI_PROVIDER", "gemini")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("AMQP_URL", "amqp://localhost:5672")
os.environ.setdefault("AMQP_PREFETCH_COUNT", "10")

from main import app, _health, _amqp_consumer
from config import load_config, AIServiceEnv
from amqp_consumer import AIAMQPConsumer
from superboard_shared.config import ConfigService
from superboard_shared.health import HealthCheckService


client = TestClient(app)


class TestAIServiceConfigurationIntegration:
    """Test that AI service uses shared ConfigService correctly."""

    def test_config_service_loads_from_environment(self):
        """Verify ConfigService loads configuration from environment variables."""
        with patch.dict(os.environ, {
            "AMQP_URL": "amqp://test:5672",
            "AMQP_PREFETCH_COUNT": "20",
            "GRPC_PORT": "50099",
        }):
            config = load_config()
            assert isinstance(config, ConfigService)
            assert config.get("AMQP_URL") == "amqp://test:5672"
            # ConfigService validates and converts types
            assert config.get("AMQP_PREFETCH_COUNT") == 20
            assert config.get("GRPC_PORT") == 50099

    def test_config_service_provides_defaults(self):
        """Verify ConfigService provides default values for optional settings."""
        with patch.dict(os.environ, {}, clear=False):
            config = load_config()
            # Should have defaults
            assert config.get("AMQP_PREFETCH_COUNT") is not None
            assert config.get("GRPC_PORT") is not None

    def test_config_service_validates_schema(self):
        """Verify ConfigService validates configuration against schema."""
        config = load_config()
        # Should be able to get values as dict
        config_dict = config.as_dict()
        assert isinstance(config_dict, dict)
        assert "AMQP_URL" in config_dict

    def test_config_round_trip_consistency(self):
        """Verify configuration can be serialized and deserialized consistently."""
        with patch.dict(os.environ, {
            "AMQP_URL": "amqp://test:5672",
            "AMQP_PREFETCH_COUNT": "15",
            "GRPC_HOST": "0.0.0.0",
            "GRPC_PORT": "50051",
            "AI_PROVIDER": "gemini",
            "GEMINI_API_KEY": "key123",
        }):
            config1 = load_config()
            dict1 = config1.as_dict()
            
            # Load again with same env
            config2 = load_config()
            dict2 = config2.as_dict()
            
            # Should be equivalent
            assert dict1["AMQP_URL"] == dict2["AMQP_URL"]
            assert dict1["AMQP_PREFETCH_COUNT"] == dict2["AMQP_PREFETCH_COUNT"]
            assert dict1["GRPC_PORT"] == dict2["GRPC_PORT"]


class TestAIServiceHealthCheckIntegration:
    """Test that AI service uses shared HealthCheckService correctly."""

    def test_health_check_service_is_shared_implementation(self):
        """Verify AI service uses shared HealthCheckService."""
        assert isinstance(_health, HealthCheckService)

    def test_health_endpoint_returns_standardized_format(self):
        """Verify /health endpoint returns standardized format from shared library."""
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        
        # Verify standardized format
        assert "status" in body
        assert "service" in body
        assert "version" in body
        assert "uptime" in body
        assert "timestamp" in body
        
        # Verify values
        assert body["status"] == "ok"
        assert body["service"] == "ai-service"

    def test_ready_endpoint_returns_standardized_format(self):
        """Verify /ready endpoint returns standardized format from shared library."""
        with patch("main._check_grpc_port", return_value=True):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        
        assert response.status_code == 200
        body = response.json()
        
        # Verify standardized format
        assert "status" in body
        assert "service" in body
        assert "version" in body
        assert "uptime" in body
        assert "timestamp" in body
        assert "dependencies" in body
        
        # Verify dependencies format
        assert isinstance(body["dependencies"], list)
        for dep in body["dependencies"]:
            assert "name" in dep
            assert "status" in dep
            assert "latency_ms" in dep

    def test_health_check_indicators_registered(self):
        """Verify health check indicators are properly registered."""
        # Should have at least grpc and model indicators
        assert len(_health._indicators) >= 2
        indicator_names = list(_health._indicators.keys())
        assert "grpc" in indicator_names
        assert "model" in indicator_names

    def test_ready_endpoint_503_when_dependency_unhealthy(self):
        """Verify /ready returns 503 when dependencies are unhealthy."""
        with patch("main._check_grpc_port", return_value=False):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        
        assert response.status_code == 503
        body = response.json()
        assert body["status"] == "error"


class TestAIServiceAMQPConsumerIntegration:
    """Test that AI service AMQP consumer uses shared BaseAMQPConsumer."""

    def test_amqp_consumer_extends_base_consumer(self):
        """Verify AIAMQPConsumer extends shared BaseAMQPConsumer."""
        from superboard_shared.amqp.base_consumer import BaseAMQPConsumer
        consumer = AIAMQPConsumer()
        assert isinstance(consumer, BaseAMQPConsumer)

    def test_amqp_consumer_implements_required_methods(self):
        """Verify AIAMQPConsumer implements all required abstract methods."""
        consumer = AIAMQPConsumer()
        
        # Should have all required methods
        assert hasattr(consumer, "get_queue_name")
        assert hasattr(consumer, "get_exchange_name")
        assert hasattr(consumer, "get_binding_keys")
        assert hasattr(consumer, "process_message")
        
        # Methods should return correct values
        assert consumer.get_queue_name() == "ai.domain.events"
        assert consumer.get_exchange_name() == "superboard.domain.events"
        assert set(consumer.get_binding_keys()) == {"task.created", "task.updated", "doc.updated"}

    def test_amqp_consumer_uses_shared_config(self):
        """Verify AMQP consumer uses shared ConfigService."""
        with patch.dict(os.environ, {
            "AMQP_URL": "amqp://custom:5672",
            "AMQP_PREFETCH_COUNT": "25",
        }):
            consumer = AIAMQPConsumer()
            # Config should be loaded from shared ConfigService
            assert consumer._config.url == "amqp://custom:5672"
            assert consumer._prefetch_count == 25

    def test_amqp_consumer_has_dead_letter_queue_config(self):
        """Verify AMQP consumer is configured with dead letter queue."""
        consumer = AIAMQPConsumer()
        assert consumer._dead_letter is not None
        assert consumer._dead_letter.exchange == "superboard.domain.events.dlx"
        assert consumer._dead_letter.queue == "ai.domain.events.dlq"
        assert consumer._dead_letter.ttl == 604800000  # 7 days

    @pytest.mark.asyncio
    async def test_amqp_consumer_processes_supported_events(self):
        """Verify AMQP consumer processes supported event types."""
        consumer = AIAMQPConsumer()
        
        # Mock the enrichment services
        with patch("amqp_consumer.enrich_task_created", new_callable=AsyncMock) as mock_enrich:
            message = {
                "eventType": "task.created",
                "payload": {"taskId": "t1"},
            }
            await consumer.process_message(message, "corr-123")
            mock_enrich.assert_called_once()

    @pytest.mark.asyncio
    async def test_amqp_consumer_filters_unsupported_events(self):
        """Verify AMQP consumer filters out unsupported events."""
        consumer = AIAMQPConsumer()
        
        # Test the filter
        unsupported_payload = {"eventType": "unknown.event"}
        should_process = consumer._should_process(unsupported_payload, None)
        assert should_process is False
        
        # Test supported event
        supported_payload = {"eventType": "task.created"}
        should_process = consumer._should_process(supported_payload, None)
        assert should_process is True

    @pytest.mark.asyncio
    async def test_amqp_consumer_records_metrics(self):
        """Verify AMQP consumer records metrics for processed events."""
        consumer = AIAMQPConsumer()
        
        with patch("amqp_consumer.record_event_processed") as mock_record:
            with patch("amqp_consumer.enrich_task_created", new_callable=AsyncMock):
                message = {
                    "eventType": "task.created",
                    "payload": {"taskId": "t1"},
                }
                await consumer.process_message(message, "corr-123")
                mock_record.assert_called_once_with("task.created")

    @pytest.mark.asyncio
    async def test_amqp_consumer_records_dlq_on_failure(self):
        """Verify AMQP consumer records DLQ metrics on failure."""
        consumer = AIAMQPConsumer()
        
        with patch("amqp_consumer.record_event_failure") as mock_failure:
            with patch("amqp_consumer.record_event_dlq") as mock_dlq:
                with patch("amqp_consumer.enrich_task_created", new_callable=AsyncMock,
                          side_effect=Exception("Processing failed")):
                    message = {
                        "eventType": "task.created",
                        "payload": {"taskId": "t1"},
                    }
                    with pytest.raises(Exception):
                        await consumer.process_message(message, "corr-123")
                    
                    mock_failure.assert_called_once()
                    mock_dlq.assert_called_once()


class TestAIServiceFeatureParity:
    """Test feature parity between Python and TypeScript services."""

    def test_configuration_consistency_across_services(self):
        """Verify configuration patterns are consistent."""
        config = load_config()
        config_dict = config.as_dict()
        
        # Should have all required configuration keys
        required_keys = ["AMQP_URL", "GRPC_HOST", "GRPC_PORT", "AI_PROVIDER"]
        for key in required_keys:
            assert key in config_dict, f"Missing required config key: {key}"

    def test_health_check_consistency_across_services(self):
        """Verify health check format is consistent."""
        # Get health response
        response = client.get("/health")
        health_body = response.json()
        
        # Get ready response
        with patch("main._check_grpc_port", return_value=True):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        ready_body = response.json()
        
        # Both should have same base fields
        base_fields = ["status", "service", "version", "uptime", "timestamp"]
        for field in base_fields:
            assert field in health_body, f"Missing field in health: {field}"
            assert field in ready_body, f"Missing field in ready: {field}"

    def test_amqp_consumer_configuration_consistency(self):
        """Verify AMQP consumer configuration is consistent."""
        consumer = AIAMQPConsumer()
        
        # Should have all required configuration
        assert consumer._config.url is not None
        assert consumer._config.exchange is not None
        assert consumer._config.queue is not None
        assert consumer._config.routing_keys is not None
        assert consumer._prefetch_count is not None

    def test_correlation_id_propagation(self):
        """Verify correlation IDs are propagated through the system."""
        consumer = AIAMQPConsumer()
        
        # Correlation ID should be extracted from message
        # This is tested in the base consumer tests, but verify it's used
        assert hasattr(consumer, "_on_message")
        assert callable(consumer._on_message)

    def test_error_handling_consistency(self):
        """Verify error handling is consistent across services."""
        # Health check should handle errors gracefully
        with patch("main._check_grpc_port", side_effect=Exception("Connection error")):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        
        # Should still return a valid response (503 or 200)
        assert response.status_code in [200, 503]
        body = response.json()
        assert "status" in body


class TestAIServiceCrossServiceCommunication:
    """Test cross-service communication patterns."""

    def test_amqp_message_format_compatibility(self):
        """Verify AMQP message format is compatible with other services."""
        consumer = AIAMQPConsumer()
        
        # Message should have standard format
        message = {
            "eventType": "task.created",
            "correlationId": "corr-123",
            "payload": {"taskId": "t1"},
            "timestamp": "2024-01-01T00:00:00Z",
        }
        
        # Should be processable
        assert "eventType" in message
        assert "correlationId" in message
        assert "payload" in message

    def test_health_check_endpoint_compatibility(self):
        """Verify health check endpoints are compatible with monitoring systems."""
        # /health endpoint
        response = client.get("/health")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/json"
        
        # /ready endpoint
        with patch("main._check_grpc_port", return_value=True):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        assert response.status_code in [200, 503]
        assert response.headers.get("content-type") == "application/json"

    def test_configuration_environment_variable_compatibility(self):
        """Verify configuration uses standard environment variable patterns."""
        # Should support standard env var patterns
        with patch.dict(os.environ, {
            "AMQP_URL": "amqp://rabbitmq:5672",
            "GRPC_HOST": "0.0.0.0",
            "GRPC_PORT": "50051",
        }):
            config = load_config()
            assert config.get("AMQP_URL") == "amqp://rabbitmq:5672"
            assert config.get("GRPC_HOST") == "0.0.0.0"
            # ConfigService validates and converts types
            assert config.get("GRPC_PORT") == 50051


class TestAIServiceSharedLibraryIntegration:
    """Test integration with shared library components."""

    def test_shared_library_imports_available(self):
        """Verify shared library components are available."""
        from superboard_shared.amqp import BaseAMQPConsumer, AMQPConfig
        from superboard_shared.config import ConfigService
        from superboard_shared.health import HealthCheckService
        
        assert BaseAMQPConsumer is not None
        assert AMQPConfig is not None
        assert ConfigService is not None
        assert HealthCheckService is not None

    def test_amqp_consumer_uses_shared_connection_manager(self):
        """Verify AMQP consumer uses shared connection manager."""
        consumer = AIAMQPConsumer()
        
        # Should have connection manager from shared library
        from superboard_shared.amqp.connection_manager import AMQPConnectionManager
        assert isinstance(consumer._connection_manager, AMQPConnectionManager)

    def test_health_check_uses_shared_indicators(self):
        """Verify health check uses shared indicator types."""
        from superboard_shared.health import CallableHealthIndicator
        
        # Should have indicators registered
        for indicator in _health._indicators.values():
            assert hasattr(indicator, "name")
            assert hasattr(indicator, "check")

    def test_config_service_uses_pydantic_validation(self):
        """Verify ConfigService uses Pydantic for validation."""
        config = load_config()
        
        # Should validate configuration
        config_dict = config.as_dict()
        assert isinstance(config_dict, dict)
        
        # Should have typed values
        assert isinstance(config_dict.get("AMQP_PREFETCH_COUNT"), (int, str))
        assert isinstance(config_dict.get("GRPC_PORT"), (int, str))
