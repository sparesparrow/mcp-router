import os
import logging
from typing import AsyncGenerator, Dict, Any, Optional, List
import anthropic

from ..interfaces.ai_service import AIService, ToolsEnabledAIService

logger = logging.getLogger(__name__)

class ClaudeAIService(AIService, ToolsEnabledAIService):
    """AI service implementation using Anthropic's Claude API."""
    
    def __init__(self):
        self._client: Optional[anthropic.AsyncAnthropic] = None
        self._model = "claude-3-sonnet-20240229"
        self._max_tokens = 4096
        logger.info("Initializing Claude AI service")

    async def initialize(self) -> None:
        """Initialize the Claude client."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        
        try:
            self._client = anthropic.AsyncAnthropic(api_key=api_key)
            logger.info("Claude client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Claude client: {str(e)}")
            raise

    async def cleanup(self) -> None:
        """Clean up resources."""
        if self._client:
            # No specific cleanup needed for Claude client
            self._client = None
            logger.info("Claude client cleaned up")

    async def stream_response(self,
        prompt: str,
        context: Dict[str, Any],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream responses from Claude API."""
        if not self._client:
            raise RuntimeError("Claude client not initialized")

        if not await self.validate_prompt(prompt):
            raise ValueError("Invalid prompt")

        try:
            system_prompt = context.get("system_prompt", "")
            temperature = context.get("temperature", 0.7)
            
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            if system_prompt:
                messages.insert(0, {
                    "role": "system",
                    "content": system_prompt
                })

            stream = await self._client.messages.stream(
                model=self._model,
                messages=messages,
                temperature=temperature,
                max_tokens=self._max_tokens,
                tools=tools
            )

            async for chunk in stream:
                if chunk.type == "content_block_delta" and chunk.delta.type == "text":
                    yield chunk.delta.text
                    
        except anthropic.APIError as e:
            logger.error(f"Claude API error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in stream_response: {str(e)}")
            raise

    async def validate_prompt(self, prompt: str) -> bool:
        """Validate prompt before processing."""
        if not prompt or not isinstance(prompt, str):
            return False
        
        # Add any additional validation logic here
        # For example, check for minimum/maximum length, content filtering, etc.
        
        return True

    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the Claude model."""
        return {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "capabilities": [
                "text generation",
                "code generation",
                "analysis",
                "conversation",
                "tool use"
            ],
            "streaming": True
        }
        
    async def process_with_tools(self,
        prompt: str,
        tools: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process a prompt with tools."""
        if not self._client:
            raise RuntimeError("Claude client not initialized")

        if not await self.validate_prompt(prompt):
            raise ValueError("Invalid prompt")
            
        context_dict = context or {}
        system_prompt = context_dict.get("system_prompt", "")
        temperature = context_dict.get("temperature", 0.7)
        
        try:
            messages = [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            if system_prompt:
                messages.insert(0, {
                    "role": "system",
                    "content": system_prompt
                })
                
            response = await self._client.messages.create(
                model=self._model,
                messages=messages,
                temperature=temperature,
                max_tokens=self._max_tokens,
                tools=tools
            )
            
            return {
                "content": response.content,
                "tool_calls": response.tool_calls if hasattr(response, "tool_calls") else [],
                "model": response.model,
                "usage": response.usage
            }
            
        except anthropic.APIError as e:
            logger.error(f"Claude API error in process_with_tools: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in process_with_tools: {str(e)}")
            raise 