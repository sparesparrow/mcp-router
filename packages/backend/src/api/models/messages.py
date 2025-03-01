from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import datetime

class ProtocolVersion(str, Enum):
    V1_0 = "1.0"
    V1_1 = "1.1"
    V2_0 = "2.0"

class MessageType(str, Enum):
    REQUEST = "request"
    RESPONSE = "response"
    EVENT = "event"
    ERROR = "error"
    DIAGNOSTIC = "diagnostic"
    HEARTBEAT = "heartbeat"

class ProtocolError(Exception):
    def __init__(self, message: str, code: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(message)

class DiagnosticLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class BaseMessage(BaseModel):
    protocol_version: ProtocolVersion = Field(..., description="Protocol version")
    message_type: MessageType
    timestamp: datetime = Field(default_factory=lambda: datetime.utcnow())
    message_id: str = Field(..., description="Unique message identifier")
    
    @validator("protocol_version")
    def validate_protocol_version(cls, v):
        if v not in ProtocolVersion.__members__.values():
            raise ProtocolError(
                message=f"Unsupported protocol version: {v}",
                code="INVALID_PROTOCOL_VERSION"
            )
        return v
    
    @validator("message_id")
    def validate_message_id(cls, v):
        if not v or len(v) > 64:
            raise ProtocolError(
                message="Invalid message ID format",
                code="INVALID_MESSAGE_ID"
            )
        return v

class RequestMessage(BaseMessage):
    message_type: MessageType = MessageType.REQUEST
    method: str
    params: Dict[str, Any] = Field(default_factory=dict)
    context: Optional[Dict[str, Any]] = None
    
    @validator("method")
    def validate_method(cls, v):
        if not v or not v.strip():
            raise ProtocolError(
                message="Method name cannot be empty",
                code="INVALID_METHOD"
            )
        if len(v) > 128:
            raise ProtocolError(
                message="Method name too long",
                code="METHOD_TOO_LONG"
            )
        return v.strip()

class ResponseMessage(BaseMessage):
    message_type: MessageType = MessageType.RESPONSE
    request_id: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None
    
    @validator("request_id")
    def validate_request_id(cls, v):
        if not v or len(v) > 64:
            raise ProtocolError(
                message="Invalid request ID format",
                code="INVALID_REQUEST_ID"
            )
        return v

class EventMessage(BaseMessage):
    message_type: MessageType = MessageType.EVENT
    event_type: str
    data: Dict[str, Any]
    source: str
    
    @validator("event_type")
    def validate_event_type(cls, v):
        if not v or not v.strip():
            raise ProtocolError(
                message="Event type cannot be empty",
                code="INVALID_EVENT_TYPE"
            )
        return v.strip()

class ErrorMessage(BaseMessage):
    message_type: MessageType = MessageType.ERROR
    error_code: str
    error_message: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    
    @validator("error_code")
    def validate_error_code(cls, v):
        if not v or not v.strip():
            raise ProtocolError(
                message="Error code cannot be empty",
                code="INVALID_ERROR_CODE"
            )
        return v.strip().upper()

class CapabilityDeclaration(BaseModel):
    name: str
    version: str
    features: List[str]
    dependencies: Optional[List[str]] = None

class HandshakeRequest(RequestMessage):
    method: str = "handshake"
    params: Dict[str, Any] = Field(default_factory=lambda: {
        "capabilities": [],
        "client_info": {}
    })

class HandshakeResponse(ResponseMessage):
    result: Dict[str, Any] = Field(default_factory=lambda: {
        "accepted": False,
        "server_capabilities": [],
        "protocol_version": ProtocolVersion.V2_0
    })

class DiagnosticMessage(BaseMessage):
    message_type: MessageType = MessageType.DIAGNOSTIC
    level: DiagnosticLevel
    component: str
    message: str
    details: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None

class HeartbeatMessage(BaseMessage):
    message_type: MessageType = MessageType.HEARTBEAT
    client_id: str
    uptime: float
    metrics: Optional[Dict[str, Any]] = None

# Message Factory for creating appropriate message types
class MessageFactory:
    @staticmethod
    def create_message(data: Dict[str, Any]) -> Union[RequestMessage, ResponseMessage, EventMessage, ErrorMessage, DiagnosticMessage, HeartbeatMessage]:
        if "message_type" not in data:
            raise ProtocolError("Missing message_type", "INVALID_MESSAGE")
            
        message_type = data["message_type"]
        try:
            if message_type == MessageType.REQUEST:
                return RequestMessage(**data)
            elif message_type == MessageType.RESPONSE:
                return ResponseMessage(**data)
            elif message_type == MessageType.EVENT:
                return EventMessage(**data)
            elif message_type == MessageType.ERROR:
                return ErrorMessage(**data)
            elif message_type == MessageType.DIAGNOSTIC:
                return DiagnosticMessage(**data)
            elif message_type == MessageType.HEARTBEAT:
                return HeartbeatMessage(**data)
            else:
                raise ProtocolError(f"Invalid message type: {message_type}", "INVALID_MESSAGE_TYPE")
        except Exception as e:
            raise ProtocolError(f"Error creating message: {str(e)}", "MESSAGE_CREATION_ERROR") 