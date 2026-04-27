"""
AMQP Consumer Framework (Python)

Provides base classes and utilities for AMQP message consumption
with connection management, reconnection logic, and dead letter queue handling.
"""

from .base_consumer import BaseAMQPConsumer
from .connection_manager import AMQPConnectionManager
from .types import AMQPConfig, AMQPMessage, DeadLetterQueueConfig, MessageProcessingContext

__all__ = [
    'BaseAMQPConsumer',
    'AMQPConnectionManager', 
    'AMQPConfig',
    'AMQPMessage',
    'DeadLetterQueueConfig',
    'MessageProcessingContext',
]
