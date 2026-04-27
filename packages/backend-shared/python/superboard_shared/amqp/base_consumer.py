"""
Base AMQP Consumer (Python) - Placeholder for Task 1
Full implementation will be done in later tasks
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseAMQPConsumer(ABC):
    """
    Base AMQP Consumer class (placeholder)
    Full implementation will be done in Task 5
    """
    
    @abstractmethod
    def get_queue_name(self) -> str:
        """Get the queue name for this consumer"""
        pass
    
    @abstractmethod
    def get_exchange_name(self) -> str:
        """Get the exchange name for this consumer"""
        pass
    
    @abstractmethod
    def get_binding_keys(self) -> List[str]:
        """Get the routing keys for this consumer"""
        pass
    
    @abstractmethod
    async def process_message(self, message: Dict[str, Any], correlation_id: str) -> None:
        """Process a message from the queue"""
        pass