"""
Health Check Service (Python)

- `/health` (liveness): basic process status
- `/ready` (readiness): checks registered dependency indicators
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Dict

from .types import DependencyHealth, HealthIndicator, HealthResult, ReadinessResult


class HealthCheckService:
    def __init__(self, *, service: str, version: str, start_time_ms: int | None = None) -> None:
        self._service = service
        self._version = version
        self._start_time_ms = start_time_ms if start_time_ms is not None else int(time.time() * 1000)
        self._indicators: Dict[str, HealthIndicator] = {}

    def register_indicator(self, indicator: HealthIndicator) -> None:
        self._indicators[indicator.name] = indicator

    def check_health(self) -> HealthResult:
        return HealthResult(
            status="ok",
            service=self._service,
            version=self._version,
            uptime=int((int(time.time() * 1000) - self._start_time_ms) / 1000),
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    async def check_readiness(self) -> ReadinessResult:
        deps: list[DependencyHealth] = []
        for indicator in self._indicators.values():
            start = int(time.time() * 1000)
            try:
                status = await indicator.check()
                deps.append(
                    DependencyHealth(
                        name=indicator.name,
                        status=status.status,
                        latency_ms=status.latency_ms if status.latency_ms else int(time.time() * 1000) - start,
                        error=status.error,
                    )
                )
            except Exception as exc:
                deps.append(
                    DependencyHealth(
                        name=indicator.name,
                        status="unhealthy",
                        latency_ms=int(time.time() * 1000) - start,
                        error=str(exc),
                    )
                )

        all_healthy = all(d.status == "healthy" for d in deps)
        base = self.check_health()
        return ReadinessResult(
            status="ok" if all_healthy else "error",
            service=base.service,
            version=base.version,
            uptime=base.uptime,
            timestamp=base.timestamp,
            dependencies=deps,
        )
