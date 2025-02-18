import pytest
from datetime import datetime
from typing import Dict, Any

from services.api.models.messages import (
    ProtocolVersion,
    MessageType,
    DiagnosticLevel,
    BaseMessage,
    RequestMessage,
    ResponseMessage,
    EventMessage,
    ErrorMessage,
    DiagnosticMessage,
    HeartbeatMessage,
    MessageFactory,
    ProtocolError
)

@pytest.fixture
def valid_base_message_data() -> Dict[str, Any]:
    return {
        "protocol_version": "2.0",
        "message_type": "request",
        "message_id": "test-123",
        "timestamp": datetime.utcnow().isoformat()
    }

class TestProtocolValidation:
    async def test_message_validation(self, valid_base_message_data):
        # Test valid message
        message = BaseMessage(**valid_base_message_data)
        assert message.protocol_version == ProtocolVersion.V2_0
        assert message.message_type == MessageType.REQUEST
        assert message.message_id == "test-123"

        # Test invalid protocol version
        with pytest.raises(ProtocolError) as exc_info:
            invalid_data = valid_base_message_data.copy()
            invalid_data["protocol_version"] = "3.0"
            BaseMessage(**invalid_data)
        assert "INVALID_PROTOCOL_VERSION" in str(exc_info.value)

        # Test invalid message ID
        with pytest.raises(ProtocolError) as exc_info:
            invalid_data = valid_base_message_data.copy()
            invalid_data["message_id"] = "a" * 65  # Too long
            BaseMessage(**invalid_data)
        assert "INVALID_MESSAGE_ID" in str(exc_info.value)

    async def test_request_message_validation(self, valid_base_message_data):
        request_data = {
            **valid_base_message_data,
            "method": "test_method",
            "params": {"key": "value"}
        }

        # Test valid request
        message = RequestMessage(**request_data)
        assert message.method == "test_method"
        assert message.params == {"key": "value"}

        # Test empty method
        with pytest.raises(ProtocolError) as exc_info:
            invalid_data = request_data.copy()
            invalid_data["method"] = ""
            RequestMessage(**invalid_data)
        assert "INVALID_METHOD" in str(exc_info.value)

        # Test method too long
        with pytest.raises(ProtocolError) as exc_info:
            invalid_data = request_data.copy()
            invalid_data["method"] = "a" * 129
            RequestMessage(**invalid_data)
        assert "METHOD_TOO_LONG" in str(exc_info.value)

    async def test_diagnostic_message_validation(self, valid_base_message_data):
        diagnostic_data = {
            **valid_base_message_data,
            "message_type": "diagnostic",
            "level": "warning",
            "component": "test_component",
            "message": "Test diagnostic message"
        }

        # Test valid diagnostic message
        message = DiagnosticMessage(**diagnostic_data)
        assert message.level == DiagnosticLevel.WARNING
        assert message.component == "test_component"
        assert message.message == "Test diagnostic message"

        # Test invalid diagnostic level
        with pytest.raises(ValueError):
            invalid_data = diagnostic_data.copy()
            invalid_data["level"] = "invalid_level"
            DiagnosticMessage(**invalid_data)

    async def test_heartbeat_message_validation(self, valid_base_message_data):
        heartbeat_data = {
            **valid_base_message_data,
            "message_type": "heartbeat",
            "client_id": "client-123",
            "uptime": 3600.5
        }

        # Test valid heartbeat message
        message = HeartbeatMessage(**heartbeat_data)
        assert message.client_id == "client-123"
        assert message.uptime == 3600.5

        # Test invalid uptime
        with pytest.raises(ValueError):
            invalid_data = heartbeat_data.copy()
            invalid_data["uptime"] = "invalid_uptime"
            HeartbeatMessage(**invalid_data)

class TestMessageFactory:
    async def test_message_creation(self, valid_base_message_data):
        # Test request message creation
        request_data = {
            **valid_base_message_data,
            "method": "test_method",
            "params": {"key": "value"}
        }
        message = MessageFactory.create_message(request_data)
        assert isinstance(message, RequestMessage)
        assert message.method == "test_method"

        # Test diagnostic message creation
        diagnostic_data = {
            **valid_base_message_data,
            "message_type": "diagnostic",
            "level": "warning",
            "component": "test_component",
            "message": "Test message"
        }
        message = MessageFactory.create_message(diagnostic_data)
        assert isinstance(message, DiagnosticMessage)
        assert message.level == DiagnosticLevel.WARNING

        # Test invalid message type
        with pytest.raises(ProtocolError) as exc_info:
            invalid_data = valid_base_message_data.copy()
            invalid_data["message_type"] = "invalid_type"
            MessageFactory.create_message(invalid_data)
        assert "INVALID_MESSAGE_TYPE" in str(exc_info.value)

class TestVersionCompatibility:
    async def test_version_compatibility(self):
        # Test V2.0 features
        v2_message = BaseMessage(
            protocol_version="2.0",
            message_type="request",
            message_id="test-123"
        )
        assert v2_message.protocol_version == ProtocolVersion.V2_0

        # Test V1.1 compatibility
        v1_1_message = BaseMessage(
            protocol_version="1.1",
            message_type="request",
            message_id="test-123"
        )
        assert v1_1_message.protocol_version == ProtocolVersion.V1_1

        # Test V1.0 compatibility
        v1_0_message = BaseMessage(
            protocol_version="1.0",
            message_type="request",
            message_id="test-123"
        )
        assert v1_0_message.protocol_version == ProtocolVersion.V1_0

class TestErrorHandling:
    async def test_error_message_handling(self, valid_base_message_data):
        error_data = {
            **valid_base_message_data,
            "message_type": "error",
            "error_code": "TEST_ERROR",
            "error_message": "Test error message",
            "details": {"key": "value"}
        }

        # Test valid error message
        message = ErrorMessage(**error_data)
        assert message.error_code == "TEST_ERROR"
        assert message.error_message == "Test error message"
        assert message.details == {"key": "value"}

        # Test empty error code
        with pytest.raises(ProtocolError) as exc_info:
            invalid_data = error_data.copy()
            invalid_data["error_code"] = ""
            ErrorMessage(**invalid_data)
        assert "INVALID_ERROR_CODE" in str(exc_info.value)

        # Test error code normalization
        message = ErrorMessage(**{
            **error_data,
            "error_code": "test_error"
        })
        assert message.error_code == "TEST_ERROR"  # Should be uppercase 