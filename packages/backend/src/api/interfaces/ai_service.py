from abc import abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional, List
from .lifecycle import Service, Initializable, Cleanable

class AIService(Service, Initializable, Cleanable):
    """Interface for AI service operations."""
    
    @abstractmethod
    async def stream_response(self, 
        prompt: str, 
        context: Dict[str, Any],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream AI responses."""
        pass
    
    @abstractmethod
    async def validate_prompt(self, prompt: str) -> bool:
        """Validate prompt before processing."""
        pass
    
    @abstractmethod
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the AI model."""
        pass

class ToolsEnabledAIService(AIService):
    """Extended interface for AI services with tool capabilities."""
    
    @abstractmethod
    async def process_with_tools(self,
        prompt: str,
        tools: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Process a prompt with tools."""
        pass 