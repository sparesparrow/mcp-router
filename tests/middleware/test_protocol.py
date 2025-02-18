import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import json
from datetime import datetime
from uuid import uuid4

from services.api.middleware.protocol import (
    ProtocolValidationMiddleware,
    ProtocolValidator
)
from services.api.models.messages import (
    ProtocolVersion,
    MessageType,
    ProtocolError
)

@pytest.fixture
def app():
    app = FastAPI()
    app.add_middleware(ProtocolValidationMiddleware)
    
    @app.post("/api/test")
    async def test_endpoint(request):
        return {"status": "ok", "message": request.state.validated_message}
        
    @app.post("/public/test")
    async def public_endpoint():
        return {"status": "ok"}
    
    return app

@pytest.fixture
def client(app):
    return TestClient(app)

@pytest.fixture
def valid_request():
    return {
        "protocol_version": ProtocolVersion.V2_0,
        "message_type": MessageType.REQUEST,
        "message_id": str(uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "method": "test_method",
        "params": {"test": "value"}
    }

class TestProtocolValidator:
    @pytest.fixture
    def validator(self):
        return ProtocolValidator()

    def test_validate_message_valid(self, validator, valid_request):
        """Test validation of valid message."""
        assert validator.validate_message(valid_request) is True

    def test_validate_message_missing_fields(self, validator):
        """Test validation with missing required fields."""
        invalid_message = {
            "message_type": MessageType.REQUEST
        }
        with pytest.raises(ProtocolError) as exc_info:
            validator.validate_message(invalid_message)
        assert exc_info.value.code == "MISSING_REQUIRED_FIELDS"

    def test_validate_message_invalid_version(self, validator, valid_request):
        """Test validation with invalid protocol version."""
        invalid_message = valid_request.copy()
        invalid_message["protocol_version"] = "invalid_version"
        with pytest.raises(ProtocolError) as exc_info:
            validator.validate_message(invalid_message)
        assert exc_info.value.code == "INVALID_PROTOCOL_VERSION"

    def test_validate_message_invalid_type(self, validator, valid_request):
        """Test validation with invalid message type."""
        invalid_message = valid_request.copy()
        invalid_message["message_type"] = "invalid_type"
        with pytest.raises(ProtocolError) as exc_info:
            validator.validate_message(invalid_message)
        assert exc_info.value.code == "INVALID_MESSAGE_TYPE"

    def test_validate_request_message(self, validator, valid_request):
        """Test validation of request message."""
        assert validator.validate_message(valid_request) is True

    def test_validate_request_missing_fields(self, validator, valid_request):
        """Test validation of request with missing fields."""
        invalid_request = valid_request.copy()
        del invalid_request["method"]
        with pytest.raises(ProtocolError) as exc_info:
            validator.validate_message(invalid_request)
        assert exc_info.value.code == "MISSING_REQUEST_FIELDS"

    def test_validate_response_message(self, validator):
        """Test validation of response message."""
        valid_response = {
            "protocol_version": ProtocolVersion.V2_0,
            "message_type": MessageType.RESPONSE,
            "message_id": str(uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": str(uuid4()),
            "result": {"status": "success"}
        }
        assert validator.validate_message(valid_response) is True

    def test_validate_response_missing_fields(self, validator):
        """Test validation of response with missing fields."""
        invalid_response = {
            "protocol_version": ProtocolVersion.V2_0,
            "message_type": MessageType.RESPONSE,
            "message_id": str(uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "result": {"status": "success"}
        }
        with pytest.raises(ProtocolError) as exc_info:
            validator.validate_message(invalid_response)
        assert exc_info.value.code == "MISSING_RESPONSE_FIELDS"

    def test_validate_event_message(self, validator):
        """Test validation of event message."""
        valid_event = {
            "protocol_version": ProtocolVersion.V2_0,
            "message_type": MessageType.EVENT,
            "message_id": str(uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": "test_event",
            "data": {"event": "data"}
        }
        assert validator.validate_message(valid_event) is True

    def test_validate_event_missing_fields(self, validator):
        """Test validation of event with missing fields."""
        invalid_event = {
            "protocol_version": ProtocolVersion.V2_0,
            "message_type": MessageType.EVENT,
            "message_id": str(uuid4()),
            "timestamp": datetime.utcnow().isoformat()
        }
        with pytest.raises(ProtocolError) as exc_info:
            validator.validate_message(invalid_event)
        assert exc_info.value.code == "MISSING_EVENT_FIELDS"

class TestProtocolValidationMiddleware:
    def test_public_endpoint(self, client):
        """Test public endpoint bypasses validation."""
        response = client.post("/public/test", json={})
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_valid_request(self, client, valid_request):
        """Test valid request passes validation."""
        response = client.post("/api/test", json=valid_request)
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_invalid_json(self, client):
        """Test invalid JSON handling."""
        response = client.post("/api/test", data="invalid json")
        assert response.status_code == 400
        assert response.json()["error_code"] == "INVALID_JSON"

    def test_protocol_error(self, client):
        """Test protocol error handling."""
        invalid_request = {
            "message_type": MessageType.REQUEST,
            "method": "test"
        }
        response = client.post("/api/test", json=invalid_request)
        assert response.status_code == 400
        assert response.json()["error_code"] == "MISSING_REQUIRED_FIELDS"

    def test_internal_error(self, client, valid_request):
        """Test internal error handling."""
        # Modify app to raise an error
        def error_endpoint():
            raise Exception("Test error")
        
        app = FastAPI()
        app.add_middleware(ProtocolValidationMiddleware)
        app.post("/api/test")(error_endpoint)
        
        test_client = TestClient(app)
        response = test_client.post("/api/test", json=valid_request)
        
        assert response.status_code == 500
        assert response.json()["error_code"] == "INTERNAL_ERROR"

    def test_message_state(self, client, valid_request):
        """Test validated message is added to request state."""
        response = client.post("/api/test", json=valid_request)
        assert response.status_code == 200
        assert response.json()["message"]["method"] == valid_request["method"]
        assert response.json()["message"]["params"] == valid_request["params"] 