"""
Unit tests for AI Service health check endpoints.
Requirements: 5.2, 5.4, 5.6
"""
import os
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# Ensure env vars are set before importing app
os.environ.setdefault("AI_PROVIDER", "gemini")
os.environ.setdefault("GEMINI_API_KEY", "test-key")

from main import app, set_grpc_started  # noqa: E402

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_returns_correct_body(self):
        response = client.get("/health")
        body = response.json()
        assert body["status"] == "ok"
        assert body["service"] == "ai-service"
        assert "version" in body
        assert "uptime" in body
        assert "timestamp" in body

    def test_health_does_not_check_dependencies(self):
        """Liveness endpoint should always return 200 regardless of dependencies."""
        with patch("main._check_grpc_port", return_value=False):
            response = client.get("/health")
        assert response.status_code == 200


class TestReadyEndpoint:
    def setup_method(self):
        set_grpc_started(False)

    def test_ready_returns_200_when_all_healthy(self):
        with patch("main._check_grpc_port", return_value=True):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        assert response.status_code == 200

    def test_ready_body_when_healthy(self):
        with patch("main._check_grpc_port", return_value=True):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        body = response.json()
        assert body["status"] == "ok"
        assert isinstance(body["dependencies"], list)
        names = [d["name"] for d in body["dependencies"]]
        assert "grpc" in names
        assert "model" in names

    def test_ready_returns_503_when_grpc_down(self):
        with patch("main._check_grpc_port", return_value=False):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        assert response.status_code == 503

    def test_ready_503_body_has_not_ready_status(self):
        with patch("main._check_grpc_port", return_value=False):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        body = response.json()
        assert body["status"] == "error"
        assert isinstance(body["dependencies"], list)

    def test_ready_503_when_model_not_configured(self):
        with patch("main._check_grpc_port", return_value=True):
            with patch.dict(os.environ, {"AI_PROVIDER": "", "GEMINI_API_KEY": "", "OPENAI_API_KEY": ""}):
                response = client.get("/ready")
        assert response.status_code == 503

    def test_ready_grpc_dependency_unhealthy_has_error_field(self):
        with patch("main._check_grpc_port", return_value=False):
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        body = response.json()
        grpc_dep = next(d for d in body["dependencies"] if d["name"] == "grpc")
        assert grpc_dep["status"] == "unhealthy"
        assert "error" in grpc_dep

    def test_ready_uses_grpc_started_flag(self):
        """When gRPC server sets the started flag, port check should be skipped."""
        set_grpc_started(True)
        with patch("main._check_grpc_port", return_value=False) as mock_check:
            with patch.dict(os.environ, {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "key"}):
                response = client.get("/ready")
        # Port check should not be called when flag is set
        mock_check.assert_not_called()
        assert response.status_code == 200

    def test_ready_grpc_port_from_env(self):
        """GRPC_PORT env var should be used in error messages."""
        with patch("main._check_grpc_port", return_value=False):
            with patch.dict(os.environ, {
                "AI_PROVIDER": "gemini",
                "GEMINI_API_KEY": "key",
                "GRPC_PORT": "50099",
            }):
                response = client.get("/ready")
        body = response.json()
        grpc_dep = next(d for d in body["dependencies"] if d["name"] == "grpc")
        assert "50099" in grpc_dep["error"]
