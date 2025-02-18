import pytest
from fastapi.testclient import TestClient
import json
from datetime import datetime
from uuid import uuid4

from services.api.models.messages import (
    ProtocolVersion,
    MessageType,
    RequestMessage,
    ResponseMessage,
    EventMessage,
    ErrorMessage,
    MessageFactory,
    ProtocolError
)

def create_valid_request():
    return {
        "protocol_version": ProtocolVersion.V2_0,
        "message_type": MessageType.REQUEST,
        "message_id": str(uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "method": "test_method",
        "params": {"test": "value"}
    }

class TestProtocolValidation:
    @pytest.fixture
    def client(self):
        from services.api.main import app
        return TestClient(app)

    def test_valid_message_creation(self):
        """Test creating valid messages of different types."""
        data = create_valid_request()
        message = MessageFactory.create_message(data)
        assert isinstance(message, RequestMessage)
        assert message.protocol_version == ProtocolVersion.V2_0
        assert message.method == "test_method"

    def test_invalid_protocol_version(self):
        """Test handling of invalid protocol version."""
        data = create_valid_request()
        data["protocol_version"] = "invalid_version"
        with pytest.raises(ProtocolError) as exc_info:
            MessageFactory.create_message(data)
        assert "INVALID_PROTOCOL_VERSION" in str(exc_info.value)

    def test_missing_required_fields(self):
        """Test handling of missing required fields."""
        data = create_valid_request()
        del data["message_id"]
        with pytest.raises(ProtocolError) as exc_info:
            MessageFactory.create_message(data)
        assert "MESSAGE_CREATION_ERROR" in str(exc_info.value)

    def test_invalid_message_type(self):
        """Test handling of invalid message type."""
        data = create_valid_request()
        data["message_type"] = "invalid_type"
        with pytest.raises(ProtocolError) as exc_info:
            MessageFactory.create_message(data)
        assert "INVALID_MESSAGE_TYPE" in str(exc_info.value)

    async def test_api_protocol_validation(self, client):
        """Test protocol validation in API endpoints."""
        # Test valid request
        response = client.post(
            "/api/test",
            json=create_valid_request()
        )
        assert response.status_code != 400

        # Test missing protocol version
        invalid_data = create_valid_request()
        del invalid_data["protocol_version"]
        response = client.post(
            "/api/test",
            json=invalid_data
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "MISSING_PROTOCOL_VERSION"

        # Test invalid JSON
        response = client.post(
            "/api/test",
            data="invalid json"
        )
        assert response.status_code == 400
        assert response.json()["error_code"] == "INVALID_JSON"

    def test_message_type_specific_validation(self):
        """Test validation specific to each message type."""
        # Test RequestMessage
        request_data = create_valid_request()
        request = MessageFactory.create_message(request_data)
        assert isinstance(request, RequestMessage)
        assert request.method == "test_method"

        # Test ResponseMessage
        response_data = {
            **create_valid_request(),
            "message_type": MessageType.RESPONSE,
            "request_id": str(uuid4()),
            "result": {"status": "success"}
        }
        response = MessageFactory.create_message(response_data)
        assert isinstance(response, ResponseMessage)
        assert "status" in response.result

        # Test EventMessage
        event_data = {
            **create_valid_request(),
            "message_type": MessageType.EVENT,
            "event_type": "test_event",
            "data": {"event": "data"},
            "source": "test_source"
        }
        event = MessageFactory.create_message(event_data)
        assert isinstance(event, EventMessage)
        assert event.event_type == "test_event"

        # Test ErrorMessage
        error_data = {
            **create_valid_request(),
            "message_type": MessageType.ERROR,
            "error_code": "TEST_ERROR",
            "error_message": "Test error message"
        }
        error = MessageFactory.create_message(error_data)
        assert isinstance(error, ErrorMessage)
        assert error.error_code == "TEST_ERROR" 