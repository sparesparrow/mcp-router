from typing import Dict, Any, List, Optional, Protocol, Union
from dataclasses import dataclass
from datetime import datetime
import logging
import psutil
import json
import aiofiles
import os
from pathlib import Path
from abc import ABC, abstractmethod
from pydantic import BaseModel

from ..core.container import get_container
from ..interfaces.service_interfaces import (
    AIServiceInterface,
    AudioServiceInterface,
    WorkflowServiceInterface,
    MetricsCollectorInterface,
    StateManagerInterface
)
from .security import SecurityManager
from .metrics import MetricsCollector
from .errors import SecurityError, ValidationError
from .aws_tools import AWSEnvironmentTool, get_aws_tool_definitions

logger = logging.getLogger(__name__)

class ToolError(Exception):
    """Base class for tool-related errors."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)

class ValidationError(ToolError):
    """Raised when tool validation fails."""
    pass

class ExecutionError(ToolError):
    """Raised when tool execution fails."""
    pass

@dataclass
class ToolMetrics:
    """Metrics for tool execution."""
    calls: int = 0
    successes: int = 0
    failures: int = 0
    total_duration: float = 0.0
    avg_duration: float = 0.0
    last_execution: Optional[datetime] = None
    error_counts: Dict[str, int] = None

    def __post_init__(self):
        self.error_counts = {}

    def update(self, duration: float, success: bool, error_code: Optional[str] = None):
        self.calls += 1
        self.total_duration += duration
        self.avg_duration = self.total_duration / self.calls
        self.last_execution = datetime.utcnow()
        
        if success:
            self.successes += 1
        else:
            self.failures += 1
            if error_code:
                self.error_counts[error_code] = self.error_counts.get(error_code, 0) + 1

class ToolValidator(Protocol):
    """Protocol for tool validation."""
    def validate_schema(self, schema: Dict[str, Any]) -> None:
        """Validate tool input schema."""
        pass

    def validate_arguments(self, schema: Dict[str, Any], arguments: Dict[str, Any]) -> None:
        """Validate tool arguments against schema."""
        pass

class DefaultToolValidator:
    """Default implementation of tool validation."""
    def validate_schema(self, schema: Dict[str, Any]) -> None:
        if not isinstance(schema, dict):
            raise ValidationError("invalid_schema", "Schema must be a dictionary")
        if schema.get("type") != "object":
            raise ValidationError("invalid_schema", "Schema type must be 'object'")
        if "properties" not in schema:
            raise ValidationError("invalid_schema", "Schema must have 'properties'")

    def validate_arguments(self, schema: Dict[str, Any], arguments: Dict[str, Any]) -> None:
        required = schema.get("required", [])
        for arg in required:
            if arg not in arguments:
                raise ValidationError("missing_argument", f"Required argument missing: {arg}")

class Tool(BaseModel):
    """Base model for MCP tools."""
    name: str
    description: str
    version: str
    capabilities: Dict[str, Any]
    rate_limit: Optional[int] = None
    timeout: Optional[int] = None

class ToolRegistry:
    """Enhanced registry for MCP tools with validation and metrics."""
    
    def __init__(self):
        self.tools: Dict[str, Tool] = {}
        self.security_manager = SecurityManager()
        self.metrics_collector = MetricsCollector()
        self.aws_tool = AWSEnvironmentTool()
        self.logger = logger.bind(component="tool_registry")
        
    async def register_tool(self, tool: Tool) -> None:
        """Register a new tool with enhanced security validation."""
        try:
            # Validate tool security
            if not await self.security_manager.validate_tool(tool):
                raise SecurityError(f"Tool {tool.name} failed security validation")
            
            # Check for existing tool
            if tool.name in self.tools:
                self.logger.warning("tool_already_registered", tool_name=tool.name)
                return
            
            # Register tool
            self.tools[tool.name] = tool
            await self.metrics_collector.record_registration(tool)
            
            self.logger.info("tool_registered", tool_name=tool.name)
        except Exception as e:
            self.logger.error("tool_registration_failed", 
                            tool_name=tool.name, 
                            error=str(e))
            raise
    
    async def get_tool(self, name: str) -> Tool:
        """Get a registered tool by name."""
        if name not in self.tools:
            raise ValidationError(f"Tool {name} not found")
        return self.tools[name]
    
    async def list_tools(self) -> Dict[str, Tool]:
        """List all registered tools."""
        return self.tools
    
    async def execute_tool(self, name: str, params: Dict[str, Any]) -> Any:
        """Execute a tool with validation and metrics."""
        try:
            # Get tool
            tool = await self.get_tool(name)
            
            # Validate rate limit
            await self.security_manager.check_rate_limit(tool)
            
            # Validate parameters
            if not await self.security_manager.validate_params(tool, params):
                raise ValidationError(f"Invalid parameters for tool {name}")
            
            # Start metrics
            start_time = datetime.utcnow()
            
            try:
                # Execute tool
                result = await tool.execute(params)
                
                # Record metrics
                duration = (datetime.utcnow() - start_time).total_seconds()
                await self.metrics_collector.record_execution(name, duration)
                
                return result
            except Exception as e:
                # Record failure metrics
                await self.metrics_collector.record_failure(name, str(e))
                raise
                
        except Exception as e:
            self.logger.error("tool_execution_failed",
                            tool_name=name,
                            error=str(e))
            raise

    def _load_builtin_tools(self) -> None:
        """Load built-in tool definitions with validation."""
        try:
            self._register_system_tools()
            self._register_workflow_tools()
            self._register_audio_tools()
            self._register_state_tools()
            self._register_ai_tools()
            self._register_aws_tools()
            logger.info(f"Loaded {len(self.tools)} built-in tools")
        except Exception as e:
            logger.error(f"Error loading built-in tools: {str(e)}")
            raise

    def _register_system_tools(self) -> None:
        """Register system monitoring tools."""
        self.register_tool(
            "system/performance",
            {
                "name": "system/performance",
                "description": "Get detailed system performance metrics with historical data",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "metrics": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of metrics to collect"
                        },
                        "interval": {"type": "number"},
                        "history_minutes": {"type": "number"}
                    }
                },
                "handler": self.handle_performance_metrics
            }
        )
        
        self.register_tool(
            "system/diagnostics",
            {
                "name": "system/diagnostics",
                "description": "Run system diagnostics and health checks",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "components": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "level": {"type": "string"}
                    }
                },
                "handler": self.handle_system_diagnostics
            }
        )

    def _register_workflow_tools(self) -> None:
        """Register workflow analysis tools."""
        self.register_tool(
            "workflow/analyze",
            {
                "name": "workflow/analyze",
                "description": "Analyze workflow execution patterns and performance",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "workflow_id": {"type": "string"},
                        "time_range": {"type": "string"},
                        "include_metrics": {"type": "boolean"}
                    },
                    "required": ["workflow_id"]
                },
                "handler": self.handle_workflow_analysis
            }
        )

        self.register_tool(
            "workflow/optimize",
            {
                "name": "workflow/optimize",
                "description": "Optimize workflow execution based on analysis",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "workflow_id": {"type": "string"},
                        "optimization_targets": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["workflow_id"]
                },
                "handler": self.handle_workflow_optimization
            }
        )

        self.register_tool(
            "code/analyze",
            {
                "name": "code/analyze",
                "description": "Analyze code quality and suggest improvements",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "file_path": {"type": "string"},
                        "analysis_type": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Types of analysis to perform (e.g., 'solid', 'complexity', 'security')"
                        }
                    },
                    "required": ["file_path"]
                },
                "handler": self.handle_code_analysis
            }
        )

        self.register_tool(
            "system/network",
            {
                "name": "system/network",
                "description": "Get detailed network information and analysis",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "include_connections": {"type": "boolean"},
                        "include_routes": {"type": "boolean"},
                        "include_stats": {"type": "boolean"}
                    }
                },
                "handler": self.handle_network_info
            }
        )

    def _register_audio_tools(self) -> None:
        """Register audio analysis tools."""
        self.register_tool(
            "audio/analyze",
            {
                "name": "audio/analyze",
                "description": "Analyze audio stream quality and performance",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "stream_id": {"type": "string"},
                        "metrics": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    }
                },
                "handler": self.handle_audio_analysis
            }
        )

    def _register_state_tools(self) -> None:
        """Register state management tools."""
        # Implementation remains the same...
        pass

    def _register_ai_tools(self) -> None:
        """Register AI-powered tools."""
        self.register_tool(
            "ai/generate-code",
            {
                "name": "ai/generate-code",
                "description": "Generate code using AI with context-aware suggestions",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "description": {
                            "type": "string",
                            "description": "Description of the code to generate"
                        },
                        "language": {
                            "type": "string",
                            "description": "Target programming language"
                        },
                        "context": {
                            "type": "object",
                            "properties": {
                                "project_type": {"type": "string"},
                                "dependencies": {"type": "array", "items": {"type": "string"}},
                                "existing_code": {"type": "string"},
                                "file_path": {"type": "string"}
                            }
                        },
                        "requirements": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Specific requirements or constraints"
                        }
                    },
                    "required": ["description", "language"]
                },
                "handler": self.handle_code_generation
            }
        )

        self.register_tool(
            "ai/analyze-code",
            {
                "name": "ai/analyze-code",
                "description": "Analyze code quality and suggest improvements using AI",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "code": {"type": "string"},
                        "language": {"type": "string"},
                        "analysis_type": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Types of analysis to perform (e.g., 'quality', 'security', 'performance')"
                        }
                    },
                    "required": ["code", "language"]
                },
                "handler": self.handle_code_analysis
            }
        )

        self.register_tool(
            "ai/generate-mermaid",
            {
                "name": "ai/generate-mermaid",
                "description": "Generate Mermaid diagrams from text description",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "Text to visualize as a diagram"
                        },
                        "diagram_type": {
                            "type": "string",
                            "enum": ["flowchart", "sequence", "class", "er", "mindmap"],
                            "description": "Type of diagram to generate"
                        },
                        "style": {
                            "type": "object",
                            "properties": {
                                "theme": {"type": "string", "enum": ["default", "dark", "forest", "neutral"]},
                                "direction": {"type": "string", "enum": ["TB", "BT", "LR", "RL"]}
                            }
                        }
                    },
                    "required": ["text", "diagram_type"]
                },
                "handler": self.handle_mermaid_generation
            }
        )

    async def handle_performance_metrics(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle system performance metrics collection."""
        metrics = params.get("metrics", ["cpu", "memory", "disk", "network"])
        interval = params.get("interval", 1)
        history_minutes = params.get("history_minutes", 5)
        
        result = {
            "current": {},
            "history": []
        }
        
        # Current metrics
        if "cpu" in metrics:
            result["current"]["cpu"] = {
                "percent": psutil.cpu_percent(interval=interval),
                "count": psutil.cpu_count(),
                "frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
            }
            
        if "memory" in metrics:
            memory = psutil.virtual_memory()
            result["current"]["memory"] = {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used
            }
            
        if "disk" in metrics:
            disk = psutil.disk_usage('/')
            result["current"]["disk"] = {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            }
            
        if "network" in metrics:
            net_io = psutil.net_io_counters()
            result["current"]["network"] = {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
                "error_in": net_io.errin,
                "error_out": net_io.errout
            }
        
        # Historical data (simplified for example)
        # In production, this would use a proper time series database
        result["history"] = [
            {
                "timestamp": (datetime.utcnow().timestamp() - (i * 60)),
                "cpu_percent": psutil.cpu_percent(),
                "memory_percent": psutil.virtual_memory().percent
            }
            for i in range(history_minutes)
        ]
        
        return result

    async def handle_workflow_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze workflow execution patterns and performance."""
        workflow_id = params["workflow_id"]
        time_range = params.get("time_range", "1h")
        include_metrics = params.get("include_metrics", True)
        
        result = {
            "workflow_id": workflow_id,
            "analysis_time": datetime.utcnow().isoformat(),
            "patterns": [],
            "bottlenecks": [],
            "recommendations": []
        }
        
        # Analyze execution patterns
        try:
            workflow_service = self.container.get(WorkflowServiceInterface)
            patterns = await workflow_service.analyze_patterns(workflow_id, time_range)
            result["patterns"] = patterns
            
            if include_metrics:
                metrics = await workflow_service.get_metrics(workflow_id, time_range)
                result["metrics"] = metrics
                
            # Identify bottlenecks
            bottlenecks = await workflow_service.identify_bottlenecks(workflow_id)
            result["bottlenecks"] = bottlenecks
            
            # Generate recommendations
            recommendations = await workflow_service.generate_recommendations(
                workflow_id,
                patterns,
                bottlenecks
            )
            result["recommendations"] = recommendations
            
        except Exception as e:
            logger.error(f"Workflow analysis failed: {str(e)}")
            raise ExecutionError("analysis_failed", str(e))
            
        return result

    async def handle_workflow_optimization(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize workflow execution based on analysis."""
        workflow_id = params["workflow_id"]
        optimization_targets = params.get("optimization_targets", ["performance", "resource_usage"])
        
        try:
            workflow_service = self.container.get(WorkflowServiceInterface)
            
            # Get current workflow state
            current_state = await workflow_service.get_workflow_state(workflow_id)
            
            # Generate optimization plan
            optimization_plan = await workflow_service.generate_optimization_plan(
                workflow_id,
                optimization_targets
            )
            
            # Apply optimizations
            optimization_results = await workflow_service.apply_optimizations(
                workflow_id,
                optimization_plan
            )
            
            return {
                "workflow_id": workflow_id,
                "optimization_time": datetime.utcnow().isoformat(),
                "targets": optimization_targets,
                "plan": optimization_plan,
                "results": optimization_results,
                "improvements": {
                    target: optimization_results.get(target, {})
                    for target in optimization_targets
                }
            }
            
        except Exception as e:
            logger.error(f"Workflow optimization failed: {str(e)}")
            raise ExecutionError("optimization_failed", str(e))

    async def handle_code_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze code quality and suggest improvements."""
        file_path = params["file_path"]
        analysis_types = params.get("analysis_type", ["solid", "complexity"])
        
        try:
            # Read file content
            async with aiofiles.open(file_path, 'r') as f:
                content = await f.read()
                
            result = {
                "file_path": file_path,
                "analysis_time": datetime.utcnow().isoformat(),
                "metrics": {},
                "issues": [],
                "recommendations": []
            }
            
            # Analyze code based on requested types
            if "solid" in analysis_types:
                solid_analysis = await self._analyze_solid_principles(content)
                result["metrics"]["solid"] = solid_analysis["metrics"]
                result["issues"].extend(solid_analysis["issues"])
                
            if "complexity" in analysis_types:
                complexity_analysis = await self._analyze_code_complexity(content)
                result["metrics"]["complexity"] = complexity_analysis["metrics"]
                result["issues"].extend(complexity_analysis["issues"])
                
            if "security" in analysis_types:
                security_analysis = await self._analyze_security(content)
                result["metrics"]["security"] = security_analysis["metrics"]
                result["issues"].extend(security_analysis["issues"])
                
            # Generate recommendations
            result["recommendations"] = await self._generate_code_recommendations(
                result["issues"],
                result["metrics"]
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Code analysis failed: {str(e)}")
            raise ExecutionError("analysis_failed", str(e))

    async def handle_audio_analysis(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze audio stream quality and performance."""
        stream_id = params.get("stream_id")
        metrics = params.get("metrics", ["quality", "latency", "errors"])
        
        # This is a placeholder implementation
        # In production, this would analyze actual audio stream data
        return {
            "stream_id": stream_id,
            "analysis_time": datetime.utcnow().isoformat(),
            "quality_metrics": {
                "bitrate": 128000,
                "sample_rate": 44100,
                "channels": 2,
                "codec": "opus"
            },
            "performance_metrics": {
                "latency_ms": 45.2,
                "jitter_ms": 2.3,
                "packet_loss": 0.001
            },
            "error_stats": {
                "total_errors": 5,
                "error_types": {
                    "buffer_underrun": 2,
                    "network_timeout": 1,
                    "decode_error": 2
                }
            }
        }

    async def handle_system_diagnostics(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Run system diagnostics and health checks."""
        components = params.get("components", ["all"])
        level = params.get("level", "basic")
        
        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "healthy",
            "checks": []
        }
        
        # System checks
        if "all" in components or "system" in components:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            result["checks"].extend([
                {
                    "component": "cpu",
                    "status": "warning" if cpu_percent > 80 else "healthy",
                    "metrics": {
                        "usage_percent": cpu_percent,
                        "count": psutil.cpu_count()
                    }
                },
                {
                    "component": "memory",
                    "status": "warning" if memory.percent > 90 else "healthy",
                    "metrics": {
                        "total_gb": memory.total / (1024**3),
                        "available_gb": memory.available / (1024**3),
                        "percent_used": memory.percent
                    }
                },
                {
                    "component": "disk",
                    "status": "warning" if disk.percent > 90 else "healthy",
                    "metrics": {
                        "total_gb": disk.total / (1024**3),
                        "free_gb": disk.free / (1024**3),
                        "percent_used": disk.percent
                    }
                }
            ])
        
        # Network checks
        if "all" in components or "network" in components:
            net_io = psutil.net_io_counters()
            result["checks"].append({
                "component": "network",
                "status": "healthy",
                "metrics": {
                    "bytes_sent": net_io.bytes_sent,
                    "bytes_recv": net_io.bytes_recv,
                    "errors": net_io.errin + net_io.errout
                }
            })
        
        # Service checks (placeholder)
        if "all" in components or "services" in components:
            result["checks"].append({
                "component": "services",
                "status": "healthy",
                "details": {
                    "total": 5,
                    "running": 5,
                    "stopped": 0
                }
            })
        
        # Set overall status
        if any(check["status"] == "warning" for check in result["checks"]):
            result["status"] = "warning"
        
        return result

    async def handle_network_info(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed network information and analysis."""
        include_connections = params.get("include_connections", True)
        include_routes = params.get("include_routes", True)
        include_stats = params.get("include_stats", True)
        
        result = {
            "timestamp": datetime.utcnow().isoformat(),
            "interfaces": [],
            "stats": {}
        }
        
        try:
            # Get network interfaces
            net_if_addrs = psutil.net_if_addrs()
            net_if_stats = psutil.net_if_stats()
            
            for interface, addrs in net_if_addrs.items():
                if_info = {
                    "name": interface,
                    "addresses": [str(addr) for addr in addrs],
                    "status": "up" if net_if_stats[interface].isup else "down",
                    "speed": net_if_stats[interface].speed
                }
                result["interfaces"].append(if_info)
                
            if include_connections:
                connections = psutil.net_connections(kind='inet')
                result["connections"] = [
                    {
                        "local_address": f"{conn.laddr.ip}:{conn.laddr.port}",
                        "remote_address": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                        "status": conn.status,
                        "pid": conn.pid
                    }
                    for conn in connections
                ]
                
            if include_stats:
                net_io = psutil.net_io_counters()
                result["stats"] = {
                    "bytes_sent": net_io.bytes_sent,
                    "bytes_recv": net_io.bytes_recv,
                    "packets_sent": net_io.packets_sent,
                    "packets_recv": net_io.packets_recv,
                    "error_in": net_io.errin,
                    "error_out": net_io.errout,
                    "drop_in": net_io.dropin,
                    "drop_out": net_io.dropout
                }
                
            return result
            
        except Exception as e:
            logger.error(f"Network info collection failed: {str(e)}")
            raise ExecutionError("network_info_failed", str(e))

    def _register_aws_tools(self) -> None:
        """Register AWS environment and credential tools."""
        self.register_tool(
            "aws/get-credentials",
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
                },
                "handler": self.handle_aws_get_credentials
            }
        )
        
        self.register_tool(
            "aws/set-environment",
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
                },
                "handler": self.handle_aws_set_environment
            }
        )
        
        self.register_tool(
            "aws/list-profiles",
            {
                "name": "aws/list-profiles",
                "description": "List available AWS profiles from AWS config",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                },
                "handler": self.handle_aws_list_profiles
            }
        )
        
        self.register_tool(
            "aws/get-account-info",
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
                },
                "handler": self.handle_aws_get_account_info
            }
        )
        
        self.register_tool(
            "aws/validate-credentials",
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
                },
                "handler": self.handle_aws_validate_credentials
            }
        )

    async def handle_aws_get_credentials(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle AWS credentials retrieval."""
        profile = params.get("profile")
        include_session_token = params.get("include_session_token", False)
        
        try:
            return await self.aws_tool.get_aws_credentials(
                profile=profile,
                include_session_token=include_session_token
            )
        except Exception as e:
            logger.error(f"AWS credentials retrieval failed: {str(e)}")
            raise ExecutionError("aws_credentials_failed", str(e))
    
    async def handle_aws_set_environment(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle AWS environment variables setting."""
        try:
            return await self.aws_tool.set_aws_environment(
                access_key_id=params.get("access_key_id"),
                secret_access_key=params.get("secret_access_key"),
                session_token=params.get("session_token"),
                region=params.get("region")
            )
        except Exception as e:
            logger.error(f"AWS environment setup failed: {str(e)}")
            raise ExecutionError("aws_environment_failed", str(e))
    
    async def handle_aws_list_profiles(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle AWS profiles listing."""
        try:
            return await self.aws_tool.list_aws_profiles()
        except Exception as e:
            logger.error(f"AWS profiles listing failed: {str(e)}")
            raise ExecutionError("aws_profiles_failed", str(e))
    
    async def handle_aws_get_account_info(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle AWS account information retrieval."""
        profile = params.get("profile")
        
        try:
            return await self.aws_tool.get_aws_account_info(profile=profile)
        except Exception as e:
            logger.error(f"AWS account info retrieval failed: {str(e)}")
            raise ExecutionError("aws_account_info_failed", str(e))
    
    async def handle_aws_validate_credentials(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle AWS credentials validation."""
        profile = params.get("profile")
        
        try:
            return await self.aws_tool.validate_aws_credentials(profile=profile)
        except Exception as e:
            logger.error(f"AWS credentials validation failed: {str(e)}")
            raise ExecutionError("aws_validation_failed", str(e))

    async def handle_code_generation(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate code using AI with context-aware suggestions."""
        description = params["description"]
        language = params["language"]
        context = params.get("context", {})
        requirements = params.get("requirements", [])

        try:
            # Get AI service
            ai_service = self.container.get(AIServiceInterface)

            # Build prompt with context and requirements
            prompt = self._build_code_generation_prompt(
                description,
                language,
                context,
                requirements
            )

            # Generate code with AI
            response = await ai_service.stream_response(
                prompt=prompt,
                context={
                    "temperature": 0.3,  # Lower temperature for more focused code generation
                    "max_tokens": 2000,
                    "stop": ["```"]  # Stop at code block end
                }
            )

            # Parse and validate generated code
            code = self._parse_code_response(response)
            validation_result = await self._validate_generated_code(
                code,
                language,
                context
            )

            return {
                "code": code,
                "language": language,
                "validation": validation_result,
                "suggestions": validation_result.get("suggestions", []),
                "metadata": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "model": "claude-3-sonnet-20240229",
                    "context_used": bool(context)
                }
            }

        except Exception as e:
            logger.error(f"Code generation failed: {str(e)}")
            raise ExecutionError("generation_failed", str(e))

    def _build_code_generation_prompt(
        self,
        description: str,
        language: str,
        context: Dict[str, Any],
        requirements: List[str]
    ) -> str:
        """Build a detailed prompt for code generation."""
        prompt_parts = [
            f"Generate {language} code that accomplishes the following:",
            f"\nDescription: {description}",
        ]

        if context:
            prompt_parts.extend([
                "\nContext:",
                f"- Project Type: {context.get('project_type', 'standalone')}",
                f"- Dependencies: {', '.join(context.get('dependencies', []))}",
                "\nExisting Code:" if context.get('existing_code') else "",
                f"```{language}\n{context.get('existing_code', '')}\n```" if context.get('existing_code') else ""
            ])

        if requirements:
            prompt_parts.extend([
                "\nRequirements:",
                *[f"- {req}" for req in requirements]
            ])

        prompt_parts.extend([
            "\nPlease ensure the code:",
            "- Is well-documented with comments",
            "- Follows best practices for the language",
            "- Includes proper error handling",
            "- Is efficient and maintainable",
            f"\nProvide the complete code in a {language} code block."
        ])

        return "\n".join(prompt_parts)

    async def _validate_generated_code(
        self,
        code: str,
        language: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate generated code and provide suggestions."""
        validation_result = {
            "is_valid": True,
            "syntax_check": True,
            "style_check": True,
            "suggestions": [],
            "potential_issues": []
        }

        try:
            # Basic syntax check
            if language.lower() in ["python", "py"]:
                import ast
                ast.parse(code)
            
            # Style check
            if language.lower() in ["python", "py"]:
                import pylint.lint
                from io import StringIO
                import sys

                # Capture pylint output
                original_stdout = sys.stdout
                sys.stdout = StringIO()
                try:
                    pylint.lint.Run(["-"], exit=False)
                finally:
                    pylint_output = sys.stdout.getvalue()
                    sys.stdout = original_stdout

                # Parse pylint output for suggestions
                if pylint_output:
                    validation_result["style_check"] = False
                    validation_result["suggestions"].extend(
                        [line.strip() for line in pylint_output.split("\n") if line.strip()]
                    )

            # Context-specific validation
            if context.get("existing_code"):
                # Check for potential naming conflicts
                existing_names = self._extract_names(context["existing_code"])
                new_names = self._extract_names(code)
                conflicts = existing_names.intersection(new_names)
                if conflicts:
                    validation_result["potential_issues"].append(
                        f"Potential naming conflicts: {', '.join(conflicts)}"
                    )

            # Dependency validation
            if context.get("dependencies"):
                missing_imports = self._check_missing_imports(
                    code,
                    context["dependencies"]
                )
                if missing_imports:
                    validation_result["suggestions"].append(
                        f"Consider importing: {', '.join(missing_imports)}"
                    )

        except SyntaxError as e:
            validation_result["is_valid"] = False
            validation_result["syntax_check"] = False
            validation_result["suggestions"].append(f"Syntax error: {str(e)}")
        except Exception as e:
            validation_result["suggestions"].append(f"Validation warning: {str(e)}")

        return validation_result

    def _parse_code_response(self, response: str) -> str:
        """Parse code from AI response."""
        # Extract code from markdown code blocks if present
        if "```" in response:
            parts = response.split("```")
            # Get the content of the first code block
            if len(parts) >= 2:
                # Remove language identifier if present
                code = parts[1].split("\n", 1)[1] if "\n" in parts[1] else parts[1]
                return code.strip()
        return response.strip()

    def _extract_names(self, code: str) -> set:
        """Extract defined names from code."""
        try:
            tree = ast.parse(code)
            names = set()
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.Name)):
                    if hasattr(node, 'name'):
                        names.add(node.name)
            return names
        except:
            return set()

    def _check_missing_imports(self, code: str, dependencies: List[str]) -> List[str]:
        """Check for missing imports from dependencies."""
        try:
            tree = ast.parse(code)
            imports = set()
            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    for name in node.names:
                        imports.add(name.name.split('.')[0])
            
            return [dep for dep in dependencies if dep not in imports]
        except:
            return []

    async def handle_mermaid_generation(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate Mermaid diagrams from text description."""
        text = params["text"]
        diagram_type = params["diagram_type"]
        style = params.get("style", {})

        try:
            # Get AI service
            ai_service = await self.container.get(AIServiceInterface)

            # Build prompt for diagram generation
            prompt = self._build_mermaid_prompt(text, diagram_type, style)

            # Generate diagram with AI
            response = ""
            async for chunk in ai_service.stream_response(
                prompt=prompt,
                context={
                    "temperature": 0.3,
                    "max_tokens": 1000,
                    "stop": ["```"]
                }
            ):
                response += chunk

            # Parse and validate diagram
            diagram = self._parse_mermaid_response(response)
            validation_result = self._validate_mermaid_diagram(diagram, diagram_type)

            return {
                "diagram": diagram,
                "type": diagram_type,
                "validation": validation_result,
                "metadata": {
                    "timestamp": datetime.utcnow().isoformat(),
                    "model": "claude-3-sonnet-20240229",
                    "style": style
                }
            }

        except Exception as e:
            logger.error(f"Mermaid diagram generation failed: {str(e)}")
            raise ExecutionError("generation_failed", str(e))

    def _build_mermaid_prompt(
        self,
        text: str,
        diagram_type: str,
        style: Dict[str, Any]
    ) -> str:
        """Build a prompt for Mermaid diagram generation."""
        prompt_parts = [
            f"Generate a Mermaid {diagram_type} diagram from the following description:",
            f"\nDescription: {text}",
            "\nRequirements:",
            f"- Use {diagram_type} diagram syntax",
            "- Keep the diagram clear and readable",
            "- Use proper Mermaid syntax",
            "- Include relevant relationships and connections",
        ]

        if style:
            prompt_parts.extend([
                "\nStyle requirements:",
                f"- Theme: {style.get('theme', 'default')}",
                f"- Direction: {style.get('direction', 'TB')}"
            ])

        prompt_parts.extend([
            "\nPlease provide only the Mermaid diagram code in a code block.",
            "Start with the appropriate diagram declaration."
        ])

        return "\n".join(prompt_parts)

    def _parse_mermaid_response(self, response: str) -> str:
        """Parse Mermaid diagram from AI response."""
        # Extract diagram from code blocks
        if "```" in response:
            parts = response.split("```")
            # Get the content of the first code block
            if len(parts) >= 2:
                # Remove mermaid identifier if present
                diagram = parts[1].split("\n", 1)[1] if "\n" in parts[1] else parts[1]
                return diagram.strip()
        return response.strip()

    def _validate_mermaid_diagram(
        self,
        diagram: str,
        diagram_type: str
    ) -> Dict[str, Any]:
        """Validate Mermaid diagram syntax and structure."""
        validation_result = {
            "is_valid": True,
            "syntax_check": True,
            "suggestions": [],
            "warnings": []
        }

        try:
            # Basic syntax validation
            if not diagram.startswith(diagram_type):
                validation_result["warnings"].append(
                    f"Diagram should start with '{diagram_type}' declaration"
                )

            # Check for common syntax elements based on diagram type
            if diagram_type == "flowchart":
                if not any(op in diagram for op in ["-->", "---", "===", "-.->"]):
                    validation_result["warnings"].append(
                        "Flowchart should include connections between nodes"
                    )

            elif diagram_type == "sequence":
                if not any(op in diagram for op in ["->", "-->", "->>", "-->>", "-x"]):
                    validation_result["warnings"].append(
                        "Sequence diagram should include message flows"
                    )

            elif diagram_type == "class":
                if not any(op in diagram for op in ["<|--", "*--", "o--", "-->"]):
                    validation_result["warnings"].append(
                        "Class diagram should include relationships"
                    )

            # Check for potential issues
            if diagram.count("{") != diagram.count("}"):
                validation_result["syntax_check"] = False
                validation_result["warnings"].append("Mismatched curly braces")

            if diagram.count("[") != diagram.count("]"):
                validation_result["syntax_check"] = False
                validation_result["warnings"].append("Mismatched square brackets")

            if diagram.count("(") != diagram.count(")"):
                validation_result["syntax_check"] = False
                validation_result["warnings"].append("Mismatched parentheses")

            # Add suggestions for improvement
            if len(diagram.split("\n")) > 50:
                validation_result["suggestions"].append(
                    "Consider simplifying the diagram for better readability"
                )

        except Exception as e:
            validation_result["is_valid"] = False
            validation_result["warnings"].append(f"Validation error: {str(e)}")

        return validation_result 