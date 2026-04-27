from __future__ import annotations

from pydantic import BaseModel, Field

import bootstrap_shared  # noqa: F401
from superboard_shared.config import ConfigService


class AIServiceEnv(BaseModel):
    AMQP_URL: str = Field(default="amqp://localhost:5672")
    AMQP_PREFETCH_COUNT: int = Field(default=10, ge=1)

    GRPC_HOST: str = Field(default="localhost")
    GRPC_PORT: int = Field(default=50051, ge=1, le=65535)

    AI_PROVIDER: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")
    OPENAI_API_KEY: str = Field(default="")


def load_config() -> ConfigService:
    return ConfigService(schema=AIServiceEnv)
