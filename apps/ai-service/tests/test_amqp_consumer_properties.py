"""
Property-based tests for AMQPEventConsumer using Hypothesis.

Feature: rabbitmq-event-bus
Property 8: ACK Sent If and Only If Processing Succeeds

Requirements: 4.3, 4.4, 5.4, 6.3, 6.4, 7.3, 7.4
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Any, Dict

import pytest
from hypothesis import given, strategies as st

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from amqp_consumer import AIAMQPConsumer


class MockIncomingMessage:
    """Mock aio_pika IncomingMessage for testing."""
    
    def __init__(self, body: bytes, should_fail: bool = False):
        self.body = body
        self._should_fail = should_fail
        self._acked = False
        self._nacked = False
        self._requeue = None
        self.correlation_id = "test-correlation"
        self.message_id = "test-message"
        self.headers = {}
        self.routing_key = "test"
        self.exchange = MagicMock()
        self.exchange.name = "superboard.domain.events"
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            # Success - should ACK
            self._acked = True
        else:
            # Failure - should NACK
            self._nacked = True
            self._requeue = False  # requeue=False for DLQ routing
    
    def process(self, requeue: bool = True):
        """Mock the message.process() context manager."""
        return self


# Test data generators
@st.composite
def event_data_strategy(draw):
    """Generate valid event data."""
    event_type = draw(st.sampled_from(["task.created", "task.updated", "doc.updated"]))
    correlation_id = draw(st.uuids().map(str))
    payload = draw(st.dictionaries(
        st.text(min_size=1, max_size=20),
        st.one_of(st.text(), st.integers(), st.booleans()),
        min_size=0,
        max_size=5
    ))
    
    return {
        "eventType": event_type,
        "correlationId": correlation_id,
        "payload": payload,
        "idempotencyKey": draw(st.uuids().map(str)),
        "producer": "test"
    }


@st.composite
def processing_outcome_strategy(draw):
    """Generate processing success/failure outcomes."""
    return draw(st.booleans())


class TestAMQPEventConsumerProperties:
    """Property-based tests for AMQP event consumer ACK/NACK behavior."""

    @given(
        event_data=event_data_strategy(),
        should_succeed=processing_outcome_strategy()
    )
    @pytest.mark.asyncio
    async def test_ack_iff_success_property(self, event_data: Dict[str, Any], should_succeed: bool):
        """
        **Property 8: ACK Sent If and Only If Processing Succeeds**
        
        For any event received by the consumer:
        - If processing succeeds → ACK should be sent
        - If processing fails → NACK(requeue=False) should be sent
        
        **Validates: Requirements 4.3, 4.4**
        """
        # Arrange
        consumer = AIAMQPConsumer()
        message_body = json.dumps(event_data).encode()
        mock_message = MockIncomingMessage(message_body)
        
        # Mock the process_message method to succeed or fail based on should_succeed
        with patch.object(consumer, 'process_message', new_callable=AsyncMock) as mock_process:
            if should_succeed:
                mock_process.return_value = None
            else:
                mock_process.side_effect = Exception("Processing failed")
            
            # Act
            try:
                await consumer._on_message(mock_message)
            except Exception:
                # Base consumer re-raises to let aio-pika NACK the message.
                pass
        
        # Assert
        if should_succeed:
            # Success case: should ACK, should not NACK
            assert mock_message._acked is True, f"Expected ACK for successful processing of {event_data['eventType']}"
            assert mock_message._nacked is False, f"Expected no NACK for successful processing of {event_data['eventType']}"
        else:
            # Failure case: should NACK with requeue=False, should not ACK
            assert mock_message._acked is False, f"Expected no ACK for failed processing of {event_data['eventType']}"
            assert mock_message._nacked is True, f"Expected NACK for failed processing of {event_data['eventType']}"
            assert mock_message._requeue is False, f"Expected NACK with requeue=False for DLQ routing of {event_data['eventType']}"

    @given(event_data=event_data_strategy())
    @pytest.mark.asyncio
    async def test_malformed_json_nack_property(self, event_data: Dict[str, Any]):
        """
        **Property 8 Extension: Malformed JSON Results in NACK**
        
        For any malformed JSON message:
        - Should NACK with requeue=False (route to DLQ)
        - Should not ACK
        
        **Validates: Requirements 4.4**
        """
        # Arrange
        consumer = AIAMQPConsumer()
        # Create malformed JSON by truncating valid JSON
        valid_json = json.dumps(event_data)
        malformed_json = valid_json[:-5].encode()  # Remove last 5 characters
        mock_message = MockIncomingMessage(malformed_json)
        
        # Act
        try:
            await consumer._on_message(mock_message)
        except Exception:
            pass
        
        # Assert
        assert mock_message._acked is False, "Expected no ACK for malformed JSON"
        assert mock_message._nacked is True, "Expected NACK for malformed JSON"
        assert mock_message._requeue is False, "Expected NACK with requeue=False for malformed JSON"

    @given(
        event_type=st.text(min_size=1, max_size=50).filter(
            lambda x: x not in ["task.created", "task.updated", "doc.updated"]
        ),
        correlation_id=st.uuids().map(str)
    )
    @pytest.mark.asyncio
    async def test_unsupported_event_type_ack_property(self, event_type: str, correlation_id: str):
        """
        **Property 8 Extension: Unsupported Event Types Are ACKed (Graceful Discard)**
        
        For any unsupported event type:
        - Should ACK (graceful discard, not an error)
        - Should not NACK
        
        **Validates: Requirements 4.2**
        """
        # Arrange
        consumer = AIAMQPConsumer()
        event_data = {
            "eventType": event_type,
            "correlationId": correlation_id,
            "payload": {},
            "idempotencyKey": "test-key"
        }
        message_body = json.dumps(event_data).encode()
        mock_message = MockIncomingMessage(message_body)
        
        # Act
        await consumer._on_message(mock_message)
        
        # Assert
        assert mock_message._acked is True, f"Expected ACK for unsupported event type '{event_type}'"
        assert mock_message._nacked is False, f"Expected no NACK for unsupported event type '{event_type}'"


if __name__ == "__main__":
    # Run a few test cases manually for verification
    import asyncio
    
    async def run_manual_test():
        test_instance = TestAMQPEventConsumerProperties()
        
        # Test success case
        event_data = {
            "eventType": "task.created",
            "correlationId": "test-correlation-id",
            "payload": {"taskId": "123"},
            "idempotencyKey": "test-key"
        }
        
        print("Testing success case...")
        await test_instance.test_ack_iff_success_property(event_data, True)
        print("✓ Success case passed")
        
        print("Testing failure case...")
        await test_instance.test_ack_iff_success_property(event_data, False)
        print("✓ Failure case passed")
        
        print("Testing malformed JSON...")
        await test_instance.test_malformed_json_nack_property(event_data)
        print("✓ Malformed JSON case passed")
        
        print("Testing unsupported event type...")
        await test_instance.test_unsupported_event_type_ack_property("unsupported.event", "test-id")
        print("✓ Unsupported event type case passed")
        
        print("\nAll manual tests passed!")
    
    asyncio.run(run_manual_test())
