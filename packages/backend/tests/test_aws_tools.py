"""
Unit tests for AWS MCP tools.
"""

import pytest
import os
from unittest.mock import Mock, patch, AsyncMock
from src.api.mcp.aws_tools import AWSEnvironmentTool, AWSCredentials, get_aws_tool_definitions


class TestAWSEnvironmentTool:
    """Test suite for AWSEnvironmentTool."""
    
    @pytest.fixture
    def aws_tool(self):
        """Create an AWS tool instance."""
        return AWSEnvironmentTool()
    
    @pytest.fixture
    def mock_env_vars(self):
        """Set up mock AWS environment variables."""
        env_vars = {
            'AWS_ACCESS_KEY_ID': 'AKIAIOSFODNN7EXAMPLE',
            'AWS_SECRET_ACCESS_KEY': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            'AWS_DEFAULT_REGION': 'us-east-1',
            'AWS_REGION': 'us-east-1'
        }
        
        with patch.dict(os.environ, env_vars, clear=False):
            yield env_vars
    
    @pytest.mark.asyncio
    async def test_get_aws_credentials_from_env(self, aws_tool, mock_env_vars):
        """Test retrieving AWS credentials from environment variables."""
        result = await aws_tool.get_aws_credentials()
        
        assert 'credentials' in result
        assert 'environment_variables' in result
        assert 'metadata' in result
        
        # Check credentials are masked
        assert result['credentials']['access_key_id'].endswith('...')
        assert result['credentials']['secret_access_key'] == '***'
        assert result['credentials']['region'] == 'us-east-1'
    
    @pytest.mark.asyncio
    async def test_set_aws_environment(self, aws_tool):
        """Test setting AWS environment variables."""
        result = await aws_tool.set_aws_environment(
            access_key_id='AKIAIOSFODNN7EXAMPLE',
            secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            region='us-west-2'
        )
        
        assert result['success'] is True
        assert 'AWS_ACCESS_KEY_ID' in result['updated_variables']
        assert 'AWS_SECRET_ACCESS_KEY' in result['updated_variables']
        assert 'AWS_DEFAULT_REGION' in result['updated_variables']
        assert 'AWS_REGION' in result['updated_variables']
        
        # Verify environment variables were set
        assert os.environ['AWS_ACCESS_KEY_ID'] == 'AKIAIOSFODNN7EXAMPLE'
        assert os.environ['AWS_DEFAULT_REGION'] == 'us-west-2'
    
    @pytest.mark.asyncio
    async def test_list_aws_profiles(self, aws_tool):
        """Test listing AWS profiles."""
        result = await aws_tool.list_aws_profiles()
        
        assert 'profiles' in result
        assert 'count' in result
        assert 'boto3_available' in result
        assert isinstance(result['profiles'], list)
    
    @pytest.mark.asyncio
    @patch('src.api.mcp.aws_tools.boto3')
    async def test_get_account_info_success(self, mock_boto3, aws_tool):
        """Test getting AWS account info successfully."""
        # Mock boto3 session and STS client
        mock_session = Mock()
        mock_sts_client = Mock()
        mock_sts_client.get_caller_identity.return_value = {
            'Account': '123456789012',
            'Arn': 'arn:aws:iam::123456789012:user/admin',
            'UserId': 'AIDACKCEVSQ6C2EXAMPLE'
        }
        mock_session.region_name = 'us-east-1'
        mock_session.client.return_value = mock_sts_client
        mock_boto3.Session.return_value = mock_session
        
        result = await aws_tool.get_aws_account_info()
        
        assert result['account_id'] == '123456789012'
        assert result['arn'] == 'arn:aws:iam::123456789012:user/admin'
        assert result['user_id'] == 'AIDACKCEVSQ6C2EXAMPLE'
        assert result['region'] == 'us-east-1'
    
    @pytest.mark.asyncio
    @patch('src.api.mcp.aws_tools.boto3')
    async def test_validate_credentials_success(self, mock_boto3, aws_tool):
        """Test validating AWS credentials successfully."""
        # Mock boto3 session and STS client
        mock_session = Mock()
        mock_sts_client = Mock()
        mock_sts_client.get_caller_identity.return_value = {
            'Account': '123456789012',
            'Arn': 'arn:aws:iam::123456789012:user/admin',
            'UserId': 'AIDACKCEVSQ6C2EXAMPLE'
        }
        mock_session.region_name = 'us-east-1'
        mock_session.client.return_value = mock_sts_client
        mock_boto3.Session.return_value = mock_session
        
        result = await aws_tool.validate_aws_credentials()
        
        assert result['valid'] is True
        assert result['account_id'] == '123456789012'
        assert result['arn'] == 'arn:aws:iam::123456789012:user/admin'
    
    @pytest.mark.asyncio
    async def test_validate_credentials_no_boto3(self, aws_tool):
        """Test validating credentials when boto3 is not available."""
        with patch('src.api.mcp.aws_tools.BOTO3_AVAILABLE', False):
            result = await aws_tool.validate_aws_credentials()
            
            assert result['valid'] is False
            assert result['error'] == 'boto3_not_available'
    
    def test_get_aws_env_vars(self, aws_tool, mock_env_vars):
        """Test getting AWS environment variables."""
        aws_vars = aws_tool._get_aws_env_vars()
        
        assert 'AWS_ACCESS_KEY_ID' in aws_vars
        assert 'AWS_SECRET_ACCESS_KEY' in aws_vars
        assert 'AWS_DEFAULT_REGION' in aws_vars
        
        # Check that sensitive values are masked
        assert aws_vars['AWS_ACCESS_KEY_ID'].endswith('...')
        assert aws_vars['AWS_SECRET_ACCESS_KEY'] in ['***', 'wJalrXUtnFEM...']
    
    def test_determine_credentials_source(self, aws_tool, mock_env_vars):
        """Test determining the source of credentials."""
        credentials = AWSCredentials(
            access_key_id='AKIAIOSFODNN7EXAMPLE',
            secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            region='us-east-1'
        )
        
        source = aws_tool._determine_credentials_source(credentials)
        assert source == 'environment_variables'
    
    def test_determine_credentials_source_profile(self, aws_tool):
        """Test determining credentials source with profile."""
        credentials = AWSCredentials(
            access_key_id='AKIAIOSFODNN7EXAMPLE',
            profile='production'
        )
        
        with patch.dict(os.environ, {}, clear=True):
            source = aws_tool._determine_credentials_source(credentials)
            assert 'profile:production' in source


class TestAWSToolDefinitions:
    """Test AWS tool definitions."""
    
    def test_get_aws_tool_definitions(self):
        """Test getting AWS tool definitions."""
        definitions = get_aws_tool_definitions()
        
        assert isinstance(definitions, list)
        assert len(definitions) == 5
        
        tool_names = [tool['name'] for tool in definitions]
        assert 'aws/get-credentials' in tool_names
        assert 'aws/set-environment' in tool_names
        assert 'aws/list-profiles' in tool_names
        assert 'aws/get-account-info' in tool_names
        assert 'aws/validate-credentials' in tool_names
    
    def test_tool_definition_structure(self):
        """Test that tool definitions have correct structure."""
        definitions = get_aws_tool_definitions()
        
        for tool_def in definitions:
            assert 'name' in tool_def
            assert 'description' in tool_def
            assert 'input_schema' in tool_def
            assert 'type' in tool_def['input_schema']
            assert 'properties' in tool_def['input_schema']


class TestAWSCredentials:
    """Test AWSCredentials dataclass."""
    
    def test_credentials_creation(self):
        """Test creating AWS credentials."""
        creds = AWSCredentials(
            access_key_id='AKIAIOSFODNN7EXAMPLE',
            secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            region='us-east-1',
            profile='default'
        )
        
        assert creds.access_key_id == 'AKIAIOSFODNN7EXAMPLE'
        assert creds.secret_access_key == 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        assert creds.region == 'us-east-1'
        assert creds.profile == 'default'
    
    def test_credentials_defaults(self):
        """Test AWS credentials with default values."""
        creds = AWSCredentials()
        
        assert creds.access_key_id is None
        assert creds.secret_access_key is None
        assert creds.session_token is None
        assert creds.region is None
        assert creds.profile is None


@pytest.mark.asyncio
async def test_integration_workflow():
    """Test a complete workflow using AWS tools."""
    tool = AWSEnvironmentTool()
    
    # Set AWS environment
    set_result = await tool.set_aws_environment(
        access_key_id='AKIAIOSFODNN7EXAMPLE',
        secret_access_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region='us-west-2'
    )
    assert set_result['success'] is True
    
    # Get credentials
    creds_result = await tool.get_aws_credentials()
    assert creds_result['credentials']['region'] == 'us-west-2'
    
    # List profiles
    profiles_result = await tool.list_aws_profiles()
    assert 'profiles' in profiles_result
    
    # Validate credentials (will fail without real credentials, but should not raise)
    validation_result = await tool.validate_aws_credentials()
    assert 'valid' in validation_result