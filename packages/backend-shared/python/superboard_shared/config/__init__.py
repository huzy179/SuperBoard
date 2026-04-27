"""
Configuration Management (Python)

Provides common configuration module with validation,
environment-specific loading, and typed configuration objects.
"""

from .config_service import ConfigService
from .validators import validate_config
from .types import ConfigValidationError, EnvironmentConfig

__all__ = [
    'ConfigService',
    'validate_config',
    'ConfigValidationError',
    'EnvironmentConfig',
]