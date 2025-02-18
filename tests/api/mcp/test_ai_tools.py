import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime

from services.api.mcp.tools import ToolRegistry, ValidationError, ExecutionError
from services.api.interfaces.service_interfaces import AIServiceInterface

@pytest.fixture
def mock_ai_service():
    service = AsyncMock()
    service.stream_response.return_value = """Here's a Python function that calculates fibonacci numbers:

```python
def fibonacci(n: int) -> int:
    '''Calculate the nth Fibonacci number.
    
    Args:
        n: The position in the Fibonacci sequence (0-based)
        
    Returns:
        The nth Fibonacci number
        
    Raises:
        ValueError: If n is negative
    '''
    if n < 0:
        raise ValueError("Position must be non-negative")
    if n <= 1:
        return n
        
    a, b = 0, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b
```"""
    return service

@pytest.fixture
def mock_container(mock_ai_service):
    container = Mock()
    container.get.return_value = mock_ai_service
    return container

@pytest.fixture
def tool_registry(mock_container):
    registry = ToolRegistry(mock_container)
    return registry

@pytest.mark.asyncio
async def test_code_generation_basic(tool_registry, mock_ai_service):
    """Test basic code generation without context."""
    result = await tool_registry.handle_code_generation({
        "description": "Create a function to calculate fibonacci numbers",
        "language": "python"
    })
    
    assert "code" in result
    assert "def fibonacci" in result["code"]
    assert result["language"] == "python"
    assert result["validation"]["is_valid"]
    assert result["validation"]["syntax_check"]
    
    # Verify AI service call
    mock_ai_service.stream_response.assert_called_once()
    call_args = mock_ai_service.stream_response.call_args[1]
    assert "fibonacci" in call_args["prompt"]
    assert call_args["context"]["temperature"] == 0.3

@pytest.mark.asyncio
async def test_code_generation_with_context(tool_registry, mock_ai_service):
    """Test code generation with project context."""
    result = await tool_registry.handle_code_generation({
        "description": "Create a function to calculate fibonacci numbers",
        "language": "python",
        "context": {
            "project_type": "library",
            "dependencies": ["typing", "math"],
            "existing_code": "def helper():\n    pass"
        },
        "requirements": [
            "Include type hints",
            "Add docstring"
        ]
    })
    
    assert "code" in result
    assert result["metadata"]["context_used"]
    
    # Verify context was included in prompt
    call_args = mock_ai_service.stream_response.call_args[1]
    prompt = call_args["prompt"]
    assert "library" in prompt
    assert "typing" in prompt
    assert "helper" in prompt
    assert "type hints" in prompt.lower()
    assert "docstring" in prompt.lower()

@pytest.mark.asyncio
async def test_code_generation_validation(tool_registry):
    """Test code validation with syntax error."""
    with patch.object(tool_registry, '_parse_code_response') as mock_parse:
        # Simulate invalid Python code
        mock_parse.return_value = "def invalid_syntax(:"
        
        result = await tool_registry.handle_code_generation({
            "description": "Create a function with syntax error",
            "language": "python"
        })
        
        assert not result["validation"]["is_valid"]
        assert not result["validation"]["syntax_check"]
        assert any("syntax error" in s.lower() for s in result["validation"]["suggestions"])

@pytest.mark.asyncio
async def test_code_generation_naming_conflicts(tool_registry):
    """Test detection of naming conflicts with existing code."""
    result = await tool_registry.handle_code_generation({
        "description": "Create a fibonacci function",
        "language": "python",
        "context": {
            "existing_code": "def fibonacci(x): return x"
        }
    })
    
    assert result["validation"]["is_valid"]  # Still valid code
    assert "fibonacci" in str(result["validation"]["potential_issues"])  # But warns about conflict

@pytest.mark.asyncio
async def test_code_generation_missing_dependencies(tool_registry):
    """Test detection of missing imports."""
    result = await tool_registry.handle_code_generation({
        "description": "Create a math function",
        "language": "python",
        "context": {
            "dependencies": ["numpy", "pandas"]
        }
    })
    
    assert "suggestions" in result["validation"]
    suggestions = " ".join(result["validation"]["suggestions"])
    assert "numpy" in suggestions or "pandas" in suggestions

@pytest.mark.asyncio
async def test_code_generation_error_handling(tool_registry, mock_ai_service):
    """Test error handling in code generation."""
    mock_ai_service.stream_response.side_effect = Exception("AI service error")
    
    with pytest.raises(ExecutionError) as exc_info:
        await tool_registry.handle_code_generation({
            "description": "Create a function",
            "language": "python"
        })
    
    assert exc_info.value.code == "generation_failed"

@pytest.mark.asyncio
async def test_prompt_building(tool_registry):
    """Test prompt building with various inputs."""
    prompt = tool_registry._build_code_generation_prompt(
        description="Create a utility function",
        language="python",
        context={
            "project_type": "web",
            "dependencies": ["fastapi"],
            "existing_code": "# Existing code\npass"
        },
        requirements=[
            "Must be async",
            "Include error handling"
        ]
    )
    
    # Verify prompt structure
    assert "Create a utility function" in prompt
    assert "python" in prompt.lower()
    assert "web" in prompt
    assert "fastapi" in prompt
    assert "Existing code" in prompt
    assert "Must be async" in prompt
    assert "error handling" in prompt
    assert "best practices" in prompt

@pytest.mark.asyncio
async def test_code_parsing(tool_registry):
    """Test parsing code from AI response."""
    # Test with markdown code block
    markdown_response = """Here's the code:
```python
def test():
    pass
```
Some explanation."""

    code = tool_registry._parse_code_response(markdown_response)
    assert code.strip() == "def test():\n    pass"
    
    # Test without code block
    plain_response = "def test():\n    pass"
    code = tool_registry._parse_code_response(plain_response)
    assert code.strip() == "def test():\n    pass" 