import pytest
from datetime import datetime, timedelta
from services.api.mcp.security import SecurityManager, RateLimitState
from services.api.mcp.tools import Tool
from services.api.mcp.errors import SecurityError

@pytest.fixture
def security_manager():
    return SecurityManager()

@pytest.fixture
def valid_tool():
    return Tool(
        name="test_tool",
        description="A test tool",
        version="1.0.0",
        capabilities={
            "required_params": ["param1"],
            "param_types": {"param1": "str"}
        },
        rate_limit=10,
        timeout=30
    )

class TestSecurityManager:
    async def test_validate_tool_valid(self, security_manager, valid_tool):
        """Test tool validation with valid tool."""
        assert await security_manager.validate_tool(valid_tool) is True

    async def test_validate_tool_missing_fields(self, security_manager):
        """Test tool validation with missing fields."""
        invalid_tool = Tool(
            name="",
            description="",
            version="1.0.0",
            capabilities={
                "required_params": [],
                "param_types": {}
            }
        )
        assert await security_manager.validate_tool(invalid_tool) is False

    async def test_validate_tool_invalid_capabilities(self, security_manager):
        """Test tool validation with invalid capabilities."""
        invalid_tool = Tool(
            name="test_tool",
            description="A test tool",
            version="1.0.0",
            capabilities={
                "invalid_field": "value"
            }
        )
        assert await security_manager.validate_tool(invalid_tool) is False

    async def test_validate_tool_invalid_rate_limit(self, security_manager):
        """Test tool validation with invalid rate limit."""
        invalid_tool = Tool(
            name="test_tool",
            description="A test tool",
            version="1.0.0",
            capabilities={
                "required_params": [],
                "param_types": {}
            },
            rate_limit=-1
        )
        assert await security_manager.validate_tool(invalid_tool) is False

    async def test_validate_params_valid(self, security_manager, valid_tool):
        """Test parameter validation with valid parameters."""
        params = {"param1": "test_value"}
        assert await security_manager.validate_params(valid_tool, params) is True

    async def test_validate_params_missing_required(self, security_manager, valid_tool):
        """Test parameter validation with missing required parameter."""
        params = {}
        assert await security_manager.validate_params(valid_tool, params) is False

    async def test_validate_params_invalid_type(self, security_manager, valid_tool):
        """Test parameter validation with invalid parameter type."""
        params = {"param1": 123}  # Should be string
        assert await security_manager.validate_params(valid_tool, params) is False

    async def test_check_rate_limit_within_limit(self, security_manager, valid_tool):
        """Test rate limit checking within limit."""
        # Should not raise exception
        await security_manager.check_rate_limit(valid_tool)
        assert security_manager.rate_limits[valid_tool.name].count == 1

    async def test_check_rate_limit_exceeded(self, security_manager, valid_tool):
        """Test rate limit checking when exceeded."""
        # Set up rate limit state
        security_manager.rate_limits[valid_tool.name] = RateLimitState(
            last_execution=datetime.utcnow(),
            count=valid_tool.rate_limit
        )

        # Should raise SecurityError
        with pytest.raises(SecurityError):
            await security_manager.check_rate_limit(valid_tool)

    async def test_check_rate_limit_reset(self, security_manager, valid_tool):
        """Test rate limit reset after time window."""
        # Set up old rate limit state
        security_manager.rate_limits[valid_tool.name] = RateLimitState(
            last_execution=datetime.utcnow() - timedelta(minutes=2),
            count=valid_tool.rate_limit
        )

        # Should not raise exception (rate limit should reset)
        await security_manager.check_rate_limit(valid_tool)
        assert security_manager.rate_limits[valid_tool.name].count == 1

    async def test_check_rate_limit_no_limit(self, security_manager, valid_tool):
        """Test rate limit checking with no limit specified."""
        valid_tool.rate_limit = None
        # Should not raise exception
        await security_manager.check_rate_limit(valid_tool) 