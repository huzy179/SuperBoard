"""
Configuration Validators (Python)

Lightweight schema-based validation helper.
"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def validate_config(config: Mapping[str, Any], schema: Any = None) -> Dict[str, Any]:
    """
    Validate a config mapping with an optional schema.

    Supported schemas:
    - None: returns dict(config)
    - pydantic BaseModel class: returns model_dump()
    - callable: called as schema(dict) and should return a validated dict-like
    """
    data = dict(config)
    if schema is None:
        return data

    # pydantic v2 BaseModel subclass
    try:
        import pydantic  # type: ignore

        if isinstance(schema, type) and issubclass(schema, pydantic.BaseModel):  # type: ignore[attr-defined]
            model = schema(**data)  # type: ignore[call-arg]
            return model.model_dump()
    except Exception:
        # Fall back to callable handling
        pass

    if callable(schema):
        validated = schema(data)
        return dict(validated)

    raise TypeError("Unsupported schema type for validate_config")
