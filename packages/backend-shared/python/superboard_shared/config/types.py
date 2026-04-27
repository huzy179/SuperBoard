"""
Configuration type definitions (Python)
"""

from dataclasses import dataclass
from typing import Any, Dict, Literal, Optional


@dataclass
class ConfigValidationError:
    """Configuration validation error"""
    field: str
    message: str
    value: Optional[Any] = None


@dataclass
class EnvironmentConfig:
    """Environment configuration"""
    NODE_ENV: Literal['development', 'production', 'test']
    PORT: Optional[int] = None
    LOG_LEVEL: Optional[Literal['error', 'warn', 'info', 'debug']] = None