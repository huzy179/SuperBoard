"""
SuperBoard Backend Shared Library (Python)

Shared backend infrastructure components for SuperBoard microservices.
Provides common functionality for AMQP consumers, health checks, configuration,
event processing, metrics, and more.
"""

__version__ = '0.1.0'
__author__ = 'SuperBoard Team'
__email__ = 'dev@superboard.com'

# Core infrastructure exports
from . import amqp
from . import health
from . import config
from . import events
from . import metrics
from . import bootstrap
from . import connections
from . import errors
from . import testing

__all__ = [
    'amqp',
    'health', 
    'config',
    'events',
    'metrics',
    'bootstrap',
    'connections',
    'errors',
    'testing',
]