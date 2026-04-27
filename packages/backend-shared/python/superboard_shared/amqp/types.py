"""
AMQP-specific type definitions (Python)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime


@dataclass
class AMQPConfig:
    """AMQP connection configuration"""
    url: str
    exchange: str
    queue: str
    routing_keys: List[str]
    prefetch_count: Optional[int] = None
    reconnect_interval: Optional[int] = None
    max_reconnect_attempts: Optional[int] = None
    dead_letter_exchange: Optional[str] = None
    dead_letter_queue: Optional[str] = None


@dataclass
class AMQPMessage:
    """AMQP message representation"""
    content: bytes
    delivery_tag: int
    redelivered: bool
    exchange: str
    routing_key: str
    correlation_id: Optional[str] = None
    message_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    headers: Optional[Dict[str, Any]] = None


@dataclass
class DeadLetterQueueConfig:
    """Dead letter queue configuration"""
    exchange: str
    queue: str
    routing_key: str
    ttl: Optional[int] = None  # Time to live in milliseconds


@dataclass
class MessageProcessingContext:
    """Context for message processing"""
    correlation_id: str
    timestamp: datetime
    retry_count: int
    start_time: float