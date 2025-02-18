import pytest
from unittest.mock import AsyncMock, MagicMock
from services.api.mcp.tools import ToolRegistry, ExecutionError

@pytest.fixture
def mock_ai_service():
    service = AsyncMock()
    service.stream_response = AsyncMock()
    return service

@pytest.fixture
def mock_container(mock_ai_service):
    container = MagicMock()
    container.get = AsyncMock(return_value=mock_ai_service)
    return container

@pytest.fixture
def tool_registry(mock_container):
    registry = ToolRegistry()
    registry.container = mock_container
    return registry

@pytest.mark.asyncio
async def test_mermaid_generation_basic(tool_registry, mock_ai_service):
    # Mock AI response
    mock_ai_service.stream_response.return_value = [
        "```mermaid\n",
        "flowchart TD\n",
        "    A[Start] --> B[Process]\n",
        "    B --> C[End]\n",
        "```"
    ]

    result = await tool_registry.execute_tool("ai/generate-mermaid", {
        "text": "Simple process flow",
        "diagram_type": "flowchart",
        "style": {"theme": "default", "direction": "TB"}
    })

    assert result["diagram"].strip() == "flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]"
    assert result["type"] == "flowchart"
    assert result["validation"]["is_valid"]

@pytest.mark.asyncio
async def test_mermaid_generation_invalid_type(tool_registry):
    with pytest.raises(ExecutionError):
        await tool_registry.execute_tool("ai/generate-mermaid", {
            "text": "Simple process flow",
            "diagram_type": "invalid_type"
        })

@pytest.mark.asyncio
async def test_mermaid_generation_validation(tool_registry, mock_ai_service):
    # Mock AI response with syntax error
    mock_ai_service.stream_response.return_value = [
        "```mermaid\n",
        "flowchart TD\n",
        "    A[Start] --> B[Process\n",  # Missing closing bracket
        "    B --> C[End]\n",
        "```"
    ]

    result = await tool_registry.execute_tool("ai/generate-mermaid", {
        "text": "Simple process flow",
        "diagram_type": "flowchart"
    })

    assert not result["validation"]["syntax_check"]
    assert any("Mismatched" in warning for warning in result["validation"]["warnings"])

@pytest.mark.asyncio
async def test_mermaid_generation_sequence_diagram(tool_registry, mock_ai_service):
    # Mock AI response
    mock_ai_service.stream_response.return_value = [
        "```mermaid\n",
        "sequenceDiagram\n",
        "    participant A as User\n",
        "    participant B as System\n",
        "    A->>B: Request\n",
        "    B-->>A: Response\n",
        "```"
    ]

    result = await tool_registry.execute_tool("ai/generate-mermaid", {
        "text": "User system interaction",
        "diagram_type": "sequence"
    })

    assert "sequenceDiagram" in result["diagram"]
    assert result["type"] == "sequence"
    assert result["validation"]["is_valid"]

@pytest.mark.asyncio
async def test_mermaid_generation_with_style(tool_registry, mock_ai_service):
    # Mock AI response
    mock_ai_service.stream_response.return_value = [
        "```mermaid\n",
        "flowchart LR\n",
        "    A[Start] --> B[Process]\n",
        "    B --> C[End]\n",
        "```"
    ]

    result = await tool_registry.execute_tool("ai/generate-mermaid", {
        "text": "Simple process flow",
        "diagram_type": "flowchart",
        "style": {
            "theme": "dark",
            "direction": "LR"
        }
    })

    assert result["metadata"]["style"]["theme"] == "dark"
    assert result["metadata"]["style"]["direction"] == "LR"
    assert result["validation"]["is_valid"] 