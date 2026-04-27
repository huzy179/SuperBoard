"""
Health check type definitions (Python)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime


@dataclass
class HealthResult:
    """Basic health check result"""
    status: Literal['ok', 'error']
    service: str
    version: str
    uptime: int
    timestamp: str


@dataclass
class DependencyHealth:
    """Health status of a dependency"""
    name: str
    status: Literal['healthy', 'unhealthy']
    latency_ms: int
    error: Optional[str] = None


@dataclass
class ReadinessResult(HealthResult):
    """Readiness check result with dependencies"""
    dependencies: List[DependencyHealth]


@dataclass
class DependencyConfig:
    """Configuration for a dependency health check"""
    name: str
    type: Literal['database', 'redis', 'rabbitmq', 'grpc', 'http']
    config: Dict[str, Any]
    timeout: Optional[int] = None


@dataclass
class HealthConfig:
    """Health check system configuration"""
    endpoints: Dict[str, str]  # {'health': '/health', 'ready': '/ready'}
    dependencies: List[DependencyConfig]


class HealthIndicator:
    """Base class for health indicators"""
    
    def __init__(self, name: str):
        self.name = name
    
    async def check(self) -> 'HealthStatus':
        """Check the health of this component"""
        raise NotImplementedError


@dataclass
class HealthStatus:
    """Health status result"""
    status: Literal['healthy', 'unhealthy']
    latency_ms: int
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None