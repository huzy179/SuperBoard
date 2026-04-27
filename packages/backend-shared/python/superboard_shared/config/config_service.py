"""
Configuration Service (Python)

Loads configuration from environment variables with optional schema validation.
"""

from __future__ import annotations

import os
from typing import Any, Dict, Mapping, Optional

from .validators import validate_config


class ConfigService:
    def __init__(
        self,
        schema: Any = None,
        env: Optional[Mapping[str, Any]] = None,
        env_overrides: Optional[Dict[str, Any]] = None,
        validate_on_load: bool = True,
    ) -> None:
        self._schema = schema
        base = dict(os.environ) if env is None else dict(env)
        if env_overrides:
            base.update(env_overrides)
        self._raw = base
        self._config: Dict[str, Any] = validate_config(base, schema) if validate_on_load else dict(base)

    def get(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def get_required(self, key: str) -> Any:
        if key not in self._config:
            raise KeyError(f"Required configuration key '{key}' not found")
        return self._config[key]

    def as_dict(self) -> Dict[str, Any]:
        return dict(self._config)

    def raw_env(self) -> Dict[str, Any]:
        return dict(self._raw)
