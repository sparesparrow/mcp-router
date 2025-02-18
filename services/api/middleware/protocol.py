from typing import Dict, Any, Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import json
import structlog

from ..models.messages import (
    ProtocolVersion,
    ProtocolError,
    MessageFactory,
    MessageType
)

logger = structlog.get_logger()

class ProtocolValidator:
    """Validates MCP protocol messages."""
    
    def __init__(self):
        self.logger = logger.bind(component="protocol_validator")
    
    def validate_message(self, message: Dict[str, Any]) -> bool:
        """Validate a protocol message."""
        try:
            # Check required fields
            if not all(k in message for k in ["protocol_version", "message_type"]):
                raise ProtocolError("Missing required fields", "MISSING_REQUIRED_FIELDS")
            
            # Validate protocol version
            if not self._validate_version(message["protocol_version"]):
                raise ProtocolError("Invalid protocol version", "INVALID_PROTOCOL_VERSION")
            
            # Validate message type
            if not self._validate_message_type(message["message_type"]):
                raise ProtocolError("Invalid message type", "INVALID_MESSAGE_TYPE")
            
            # Validate message-type specific fields
            if message["message_type"] == MessageType.REQUEST:
                if not all(k in message for k in ["method", "params"]):
                    raise ProtocolError("Missing required request fields", "MISSING_REQUEST_FIELDS")
                    
            elif message["message_type"] == MessageType.RESPONSE:
                if "request_id" not in message:
                    raise ProtocolError("Missing request_id in response", "MISSING_RESPONSE_FIELDS")
                    
            elif message["message_type"] == MessageType.EVENT:
                if not all(k in message for k in ["event_type", "data"]):
                    raise ProtocolError("Missing required event fields", "MISSING_EVENT_FIELDS")
            
            return True
            
        except ProtocolError:
            raise
        except Exception as e:
            self.logger.error("message_validation_failed", error=str(e))
            raise ProtocolError("Message validation failed", "VALIDATION_FAILED")
    
    def _validate_version(self, version: str) -> bool:
        """Validate protocol version."""
        try:
            return version in ProtocolVersion.__members__.values()
        except:
            return False
    
    def _validate_message_type(self, message_type: str) -> bool:
        """Validate message type."""
        try:
            return message_type in MessageType.__members__.values()
        except:
            return False

class ProtocolValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for validating MCP protocol messages."""
    
    def __init__(self, app):
        super().__init__(app)
        self.validator = ProtocolValidator()
        self.logger = logger.bind(component="protocol_middleware")
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process the request through protocol validation."""
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        try:
            # Clone request body since it can only be read once
            body = await request.body()
            json_body = json.loads(body)

            # Validate protocol message
            self.validator.validate_message(json_body)

            # Create appropriate message type
            message = MessageFactory.create_message(json_body)

            # Add validated message to request state
            request.state.validated_message = message

            # Proceed with request
            response = await call_next(request)

            return response

        except json.JSONDecodeError:
            return Response(
                content=json.dumps({
                    "message_type": MessageType.ERROR,
                    "protocol_version": ProtocolVersion.V2_0,
                    "error_code": "INVALID_JSON",
                    "error_message": "Invalid JSON payload"
                }),
                status_code=400,
                media_type="application/json"
            )
        except ProtocolError as e:
            return Response(
                content=json.dumps({
                    "message_type": MessageType.ERROR,
                    "protocol_version": ProtocolVersion.V2_0,
                    "error_code": e.code,
                    "error_message": e.message
                }),
                status_code=400,
                media_type="application/json"
            )
        except Exception as e:
            self.logger.error("protocol_validation_failed", error=str(e))
            return Response(
                content=json.dumps({
                    "message_type": MessageType.ERROR,
                    "protocol_version": ProtocolVersion.V2_0,
                    "error_code": "INTERNAL_ERROR",
                    "error_message": str(e)
                }),
                status_code=500,
                media_type="application/json"
            ) 