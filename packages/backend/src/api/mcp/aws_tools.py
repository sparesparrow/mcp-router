"""
AWS Environment Variables Tool for MCP Server

Provides secure access to AWS credentials and environment variables
through the Model Context Protocol.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logger.warning("boto3 not available. AWS tools will have limited functionality.")


@dataclass
class AWSCredentials:
    """AWS credentials data structure."""
    access_key_id: Optional[str] = None
    secret_access_key: Optional[str] = None
    session_token: Optional[str] = None
    region: Optional[str] = None
    profile: Optional[str] = None


class AWSEnvironmentTool:
    """Tool for managing AWS environment variables and credentials."""
    
    def __init__(self):
        self.logger = logger.bind(component="aws_environment_tool")
        
    async def get_aws_credentials(
        self,
        profile: Optional[str] = None,
        include_session_token: bool = False
    ) -> Dict[str, Any]:
        """
        Retrieve AWS credentials from environment or AWS config.
        
        Args:
            profile: Optional AWS profile name
            include_session_token: Whether to include session token
            
        Returns:
            Dictionary with AWS credentials and metadata
        """
        try:
            credentials = AWSCredentials()
            
            # Try to get credentials from environment variables
            credentials.access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
            credentials.secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
            credentials.session_token = os.getenv('AWS_SESSION_TOKEN')
            credentials.region = os.getenv('AWS_DEFAULT_REGION', os.getenv('AWS_REGION'))
            
            # If boto3 is available, try to get credentials from AWS config
            if BOTO3_AVAILABLE and not credentials.access_key_id:
                try:
                    session = boto3.Session(profile_name=profile)
                    aws_credentials = session.get_credentials()
                    
                    if aws_credentials:
                        credentials.access_key_id = aws_credentials.access_key
                        credentials.secret_access_key = aws_credentials.secret_key
                        credentials.session_token = aws_credentials.token
                        credentials.region = session.region_name
                        credentials.profile = profile
                except (NoCredentialsError, ClientError) as e:
                    self.logger.warning(f"Could not retrieve AWS credentials: {str(e)}")
            
            # Build response
            result = {
                "timestamp": datetime.utcnow().isoformat(),
                "credentials": {
                    "access_key_id": credentials.access_key_id[:10] + "..." if credentials.access_key_id else None,
                    "secret_access_key": "***" if credentials.secret_access_key else None,
                    "region": credentials.region,
                    "profile": credentials.profile,
                    "has_session_token": bool(credentials.session_token)
                },
                "environment_variables": self._get_aws_env_vars(),
                "metadata": {
                    "boto3_available": BOTO3_AVAILABLE,
                    "credentials_source": self._determine_credentials_source(credentials)
                }
            }
            
            # Include session token if requested
            if include_session_token and credentials.session_token:
                result["credentials"]["session_token"] = credentials.session_token[:20] + "..."
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error retrieving AWS credentials: {str(e)}")
            raise
    
    async def set_aws_environment(
        self,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        session_token: Optional[str] = None,
        region: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Set AWS environment variables.
        
        Args:
            access_key_id: AWS access key ID
            secret_access_key: AWS secret access key
            session_token: AWS session token (optional)
            region: AWS region
            
        Returns:
            Dictionary with operation status
        """
        try:
            updated_vars = []
            
            if access_key_id:
                os.environ['AWS_ACCESS_KEY_ID'] = access_key_id
                updated_vars.append('AWS_ACCESS_KEY_ID')
            
            if secret_access_key:
                os.environ['AWS_SECRET_ACCESS_KEY'] = secret_access_key
                updated_vars.append('AWS_SECRET_ACCESS_KEY')
            
            if session_token:
                os.environ['AWS_SESSION_TOKEN'] = session_token
                updated_vars.append('AWS_SESSION_TOKEN')
            
            if region:
                os.environ['AWS_DEFAULT_REGION'] = region
                os.environ['AWS_REGION'] = region
                updated_vars.append('AWS_DEFAULT_REGION')
                updated_vars.append('AWS_REGION')
            
            return {
                "success": True,
                "timestamp": datetime.utcnow().isoformat(),
                "updated_variables": updated_vars,
                "message": f"Successfully set {len(updated_vars)} AWS environment variable(s)"
            }
            
        except Exception as e:
            self.logger.error(f"Error setting AWS environment: {str(e)}")
            raise
    
    async def list_aws_profiles(self) -> Dict[str, Any]:
        """
        List available AWS profiles from AWS config.
        
        Returns:
            Dictionary with available AWS profiles
        """
        try:
            profiles = []
            
            if BOTO3_AVAILABLE:
                try:
                    # Get available profiles from boto3
                    session = boto3.Session()
                    profiles = session.available_profiles
                except Exception as e:
                    self.logger.warning(f"Could not list AWS profiles: {str(e)}")
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "profiles": profiles,
                "count": len(profiles),
                "boto3_available": BOTO3_AVAILABLE
            }
            
        except Exception as e:
            self.logger.error(f"Error listing AWS profiles: {str(e)}")
            raise
    
    async def get_aws_account_info(self, profile: Optional[str] = None) -> Dict[str, Any]:
        """
        Get AWS account information using STS.
        
        Args:
            profile: Optional AWS profile name
            
        Returns:
            Dictionary with AWS account information
        """
        try:
            if not BOTO3_AVAILABLE:
                return {
                    "error": "boto3 not available",
                    "message": "Install boto3 to use this feature"
                }
            
            session = boto3.Session(profile_name=profile)
            sts_client = session.client('sts')
            
            # Get caller identity
            identity = sts_client.get_caller_identity()
            
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "account_id": identity.get('Account'),
                "arn": identity.get('Arn'),
                "user_id": identity.get('UserId'),
                "region": session.region_name,
                "profile": profile
            }
            
        except NoCredentialsError:
            return {
                "error": "no_credentials",
                "message": "AWS credentials not found"
            }
        except ClientError as e:
            self.logger.error(f"AWS client error: {str(e)}")
            return {
                "error": "client_error",
                "message": str(e)
            }
        except Exception as e:
            self.logger.error(f"Error getting AWS account info: {str(e)}")
            raise
    
    async def validate_aws_credentials(
        self,
        profile: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate AWS credentials by making a test API call.
        
        Args:
            profile: Optional AWS profile name
            
        Returns:
            Dictionary with validation result
        """
        try:
            if not BOTO3_AVAILABLE:
                return {
                    "valid": False,
                    "error": "boto3_not_available",
                    "message": "Install boto3 to validate credentials"
                }
            
            session = boto3.Session(profile_name=profile)
            sts_client = session.client('sts')
            
            # Try to get caller identity
            identity = sts_client.get_caller_identity()
            
            return {
                "valid": True,
                "timestamp": datetime.utcnow().isoformat(),
                "account_id": identity.get('Account'),
                "arn": identity.get('Arn'),
                "region": session.region_name,
                "profile": profile
            }
            
        except NoCredentialsError:
            return {
                "valid": False,
                "error": "no_credentials",
                "message": "AWS credentials not found or not configured"
            }
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            return {
                "valid": False,
                "error": "invalid_credentials",
                "error_code": error_code,
                "message": str(e)
            }
        except Exception as e:
            self.logger.error(f"Error validating AWS credentials: {str(e)}")
            return {
                "valid": False,
                "error": "validation_error",
                "message": str(e)
            }
    
    def _get_aws_env_vars(self) -> Dict[str, str]:
        """Get all AWS-related environment variables."""
        aws_vars = {}
        aws_prefixes = ['AWS_', 'AMAZON_']
        
        for key, value in os.environ.items():
            if any(key.startswith(prefix) for prefix in aws_prefixes):
                # Mask sensitive values
                if any(sensitive in key.upper() for sensitive in ['KEY', 'SECRET', 'TOKEN', 'PASSWORD']):
                    if value:
                        aws_vars[key] = value[:10] + "..." if len(value) > 10 else "***"
                    else:
                        aws_vars[key] = None
                else:
                    aws_vars[key] = value
        
        return aws_vars
    
    def _determine_credentials_source(self, credentials: AWSCredentials) -> str:
        """Determine the source of AWS credentials."""
        if os.getenv('AWS_ACCESS_KEY_ID'):
            return "environment_variables"
        elif credentials.profile:
            return f"aws_config_profile:{credentials.profile}"
        elif BOTO3_AVAILABLE:
            return "aws_config_default"
        else:
            return "not_configured"


# Tool registration helpers
def get_aws_tool_definitions() -> List[Dict[str, Any]]:
    """
    Get AWS tool definitions for MCP tool registry.
    
    Returns:
        List of tool definitions
    """
    return [
        {
            "name": "aws/get-credentials",
            "description": "Retrieve AWS credentials and environment variables",
            "input_schema": {
                "type": "object",
                "properties": {
                    "profile": {
                        "type": "string",
                        "description": "AWS profile name (optional)"
                    },
                    "include_session_token": {
                        "type": "boolean",
                        "description": "Include session token in response",
                        "default": False
                    }
                }
            }
        },
        {
            "name": "aws/set-environment",
            "description": "Set AWS environment variables",
            "input_schema": {
                "type": "object",
                "properties": {
                    "access_key_id": {
                        "type": "string",
                        "description": "AWS access key ID"
                    },
                    "secret_access_key": {
                        "type": "string",
                        "description": "AWS secret access key"
                    },
                    "session_token": {
                        "type": "string",
                        "description": "AWS session token (optional)"
                    },
                    "region": {
                        "type": "string",
                        "description": "AWS region"
                    }
                }
            }
        },
        {
            "name": "aws/list-profiles",
            "description": "List available AWS profiles from AWS config",
            "input_schema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "aws/get-account-info",
            "description": "Get AWS account information using STS",
            "input_schema": {
                "type": "object",
                "properties": {
                    "profile": {
                        "type": "string",
                        "description": "AWS profile name (optional)"
                    }
                }
            }
        },
        {
            "name": "aws/validate-credentials",
            "description": "Validate AWS credentials by making a test API call",
            "input_schema": {
                "type": "object",
                "properties": {
                    "profile": {
                        "type": "string",
                        "description": "AWS profile name (optional)"
                    }
                }
            }
        }
    ]