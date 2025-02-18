import os
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Union, Sequence
from pathlib import Path
import anthropic
from anthropic.types import ContentBlock, Message
import yaml
import json
from jinja2 import Template, Environment, FileSystemLoader
import logging
from enum import Enum
from mcp.client import MCPClient

class ToolManager:
    def __init__(self, mcp_client: MCPClient):
        self.mcp_client = mcp_client
        self.tools: Dict[str, Dict[str, Any]] = {}
        
    async def load_tools(self, tools_dir: str):
        """Load tool definitions from directory"""
        tools_path = Path(tools_dir)
        if not tools_path.exists():
            return
            
        for file in tools_path.glob("*.yaml"):
            try:
                with file.open() as f:
                    data = yaml.safe_load(f)
                    self.tools[file.stem] = data
            except Exception as e:
                logging.error(f"Error loading tool {file}: {str(e)}")
                
    async def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        """Get tool definition by name"""
        return self.tools.get(name)

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

@dataclass
class SystemPrompt:
    """System prompt configuration."""
    content: str
    description: Optional[str] = None
    tags: List[str] = field(default_factory=list)

@dataclass
class Example:
    """Example configuration for few-shot learning."""
    query: str
    output: str
    description: Optional[str] = None
    tags: List[str] = field(default_factory=list)

@dataclass
class Tool:
    """Tool configuration."""
    name: str
    description: str
    input_schema: Dict[str, Any]
    handler: Optional[callable] = None

@dataclass
class MessageConfig:
    """Message configuration."""
    model: str = "claude-3-5-sonnet-20241022"
    max_tokens: int = 8192
    temperature: float = 0
    system: Optional[str] = None
    tools: Optional[List[Tool]] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.max_tokens < 0:
            raise ValueError("max_tokens must be positive")
        if not 0 <= self.temperature <= 1:
            raise ValueError("temperature must be between 0 and 1")

class AnthropicClient:
    """
    Comprehensive client for interacting with Anthropic's API.
    Handles templates, system prompts, tools, and message management.
    """
    
    def __init__(self, 
                 api_key: Optional[str] = None,
                 templates_dir: Union[str, Path] = "templates",
                 default_config: Optional[MessageConfig] = None,
                 logger: Optional[logging.Logger] = None):
        """
        Initialize the Anthropic client.
        
        Args:
            api_key: Optional API key (defaults to environment variable)
            templates_dir: Directory containing templates and configurations
            default_config: Default message configuration
            logger: Optional logger instance
        """
        # API setup
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("API key must be provided either directly or via ANTHROPIC_API_KEY environment variable")
        
        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.default_config = default_config or MessageConfig()
        
        # Template setup
        self.templates_dir = Path(templates_dir)
        self.env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Logging setup
        self.logger = logger or logging.getLogger(__name__)
        
        # Load resources
        self._load_resources()

    def _load_resources(self) -> None:
        """Load all resource configurations."""
        try:
            self.templates = self._load_templates()
            self.system_prompts = self._load_system_prompts()
            self.examples = self._load_examples()
            self.tools = self._load_tools()
        except Exception as e:
            self.logger.error(f"Error loading resources: {str(e)}")
            raise RuntimeError("Failed to initialize client resources") from e

    def _load_templates(self) -> Dict[str, Template]:
        """Load template files."""
        templates = {}
        template_path = self.templates_dir / "templates"
        if template_path.exists():
            for file in template_path.glob("*.j2"):
                templates[file.stem] = self.env.get_template(f"templates/{file.name}")
        return templates

    def _load_system_prompts(self) -> Dict[str, SystemPrompt]:
        """Load system prompts."""
        prompts = {}
        prompts_path = self.templates_dir / "system_prompts"
        if prompts_path.exists():
            for file in prompts_path.glob("*.yaml"):
                with file.open() as f:
                    data = yaml.safe_load(f)
                    prompts[file.stem] = SystemPrompt(**data)
        return prompts

    def _load_examples(self) -> Dict[str, List[Example]]:
        """Load examples."""
        examples = {}
        examples_path = self.templates_dir / "examples"
        if examples_path.exists():
            for file in examples_path.glob("*.yaml"):
                with file.open() as f:
                    data = yaml.safe_load(f)
                    examples[file.stem] = [Example(**ex) for ex in data]
        return examples

    def _load_tools(self) -> Dict[str, Tool]:
        """Load tool configurations."""
        tools = {}
        tools_path = self.templates_dir / "tools"
        if tools_path.exists():
            for file in tools_path.glob("*.yaml"):
                with file.open() as f:
                    data = yaml.safe_load(f)
                    tools[file.stem] = Tool(**data)
        return tools

    async def create_message(self,
                           content: Union[str, List[ContentBlock]],
                           config: Optional[MessageConfig] = None,
                           template_name: Optional[str] = None,
                           template_variables: Optional[Dict[str, Any]] = None,
                           example_tags: Optional[List[str]] = None) -> Message:
        """
        Create a message with the specified content and configuration.
        
        Args:
            content: Message content (string or content blocks)
            config: Message configuration (uses default if not provided)
            template_name: Optional template to use
            template_variables: Variables for template rendering
            example_tags: Tags for filtering examples to include
            
        Returns:
            Message: The API response message
        """
        try:
            # Use provided config or default
            msg_config = config or self.default_config
            
            # Prepare content blocks
            content_blocks = []
            
            # Add examples if requested
            if example_tags:
                examples_content = self._prepare_examples(example_tags)
                if examples_content:
                    content_blocks.append(examples_content)
            
            # Handle template if specified
            if template_name:
                if template_name not in self.templates:
                    raise ValueError(f"Template {template_name} not found")
                template = self.templates[template_name]
                rendered_content = template.render(**(template_variables or {}))
                content_blocks.append({
                    "type": "text",
                    "text": rendered_content
                })
            # Handle direct content
            elif isinstance(content, str):
                content_blocks.append({
                    "type": "text",
                    "text": content
                })
            else:
                content_blocks.extend(content)
            
            # Create message
            message = await self.client.messages.create(
                model=msg_config.model,
                max_tokens=msg_config.max_tokens,
                temperature=msg_config.temperature,
                system=msg_config.system,
                tools=[tool.dict() for tool in (msg_config.tools or [])],
                messages=[{
                    "role": MessageRole.USER.value,
                    "content": content_blocks
                }],
                metadata=msg_config.metadata
            )
            
            self.logger.debug(f"Created message with ID: {message.id}")
            return message
            
        except Exception as e:
            self.logger.error(f"Error creating message: {str(e)}")
            raise

    async def create_tool_message(self,
                                tool_name: str,
                                tool_input: Dict[str, Any],
                                config: Optional[MessageConfig] = None) -> Message:
        """
        Create a message for tool use.
        
        Args:
            tool_name: Name of the tool to use
            tool_input: Input data for the tool
            config: Message configuration (uses default if not provided)
            
        Returns:
            Message: The API response message
        """
        try:
            if tool_name not in self.tools:
                raise ValueError(f"Tool {tool_name} not found")
            
            tool = self.tools[tool_name]
            msg_config = config or self.default_config
            
            content = [
                {
                    "type": "text",
                    "text": f"Using {tool_name} to process the request:"
                },
                {
                    "type": "tool_use",
                    "name": tool_name,
                    "id": anthropic.utils.random_id(),
                    "input": tool_input
                }
            ]
            
            message = await self.client.messages.create(
                model=msg_config.model,
                system=msg_config.system,
                messages=[{
                    "role": MessageRole.USER.value,
                    "content": content
                }]
            )
            
            self.logger.debug(f"Created tool message with ID: {message.id}")
            return message
            
        except Exception as e:
            self.logger.error(f"Error creating tool message: {str(e)}")
            raise

    def _prepare_examples(self, tags: List[str]) -> Optional[ContentBlock]:
        """Prepare examples content block based on tags."""
        matching_examples = []
        for examples_list in self.examples.values():
            for example in examples_list:
                if any(tag in example.tags for tag in tags):
                    matching_examples.append(example)
        
        if not matching_examples:
            return None
            
        examples_text = "<examples>\n" + "\n".join(
            f"<example>\n<query>{ex.query}</query>\n<output>{ex.output}</output>\n</example>"
            for ex in matching_examples
        ) + "\n</examples>"
        
        return {
            "type": "text",
            "text": examples_text
        }

    def get_system_prompt(self, name: str) -> Optional[SystemPrompt]:
        """Get a system prompt by name."""
        return self.system_prompts.get(name)

    def get_tool(self, name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self.tools.get(name)

    def get_examples(self, tags: Optional[List[str]] = None) -> List[Example]:
        """Get examples filtered by tags."""
        if not tags:
            return [ex for examples in self.examples.values() for ex in examples]
        
        return [
            ex for examples in self.examples.values() 
            for ex in examples 
            if any(tag in ex.tags for tag in tags)
        ]
    

class AnthropicMCPClient:
    def __init__(self, api_key: str, mcp_client: MCPClient):
        self.api_key = api_key
        self.mcp_client = mcp_client
        
    async def create_message(self, 
                           content: str,
                           tools: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        message_params = {
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 8192,
            "temperature": 0,
            "content": content,
            "tools": tools
        }
        
        response = await self.mcp_client.call_tool(
            "anthropic/messages/create",
            **message_params
        )
        
        return response.result
    
def main():
    """Example usage of the AnthropicClient."""
    import asyncio
    
    async def run_example():
        # Initialize client with default configuration
        config = MessageConfig(
            model="claude-3-5-sonnet-20241022",
            max_tokens=8192,
            temperature=0,
            system="You are a helpful assistant."
        )
        
        client = AnthropicClient(default_config=config)
        
        # Example: Create message with template
        message = await client.create_message(
            content="Hello, how can I help you?",
            template_name="basic_response",
            template_variables={"greeting": "Hello"},
            example_tags=["greeting"]
        )
        
        print(message.content)
    
    asyncio.run(run_example())

if __name__ == "__main__":
    main()

    