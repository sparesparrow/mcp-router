from typing import Dict, Any, Optional, List, Pattern, Tuple
import asyncio
import logging
from datetime import datetime, UTC
import pyperclip
import re
import hashlib
from pydantic import BaseModel, Field
from ..base import MonitoringService, MonitoringMetric, MonitoringConfig, MCPNotification

class ClipboardConfig(MonitoringConfig):
    """Configuration for clipboard monitoring with MCP support."""
    def __init__(
        self,
        interval_seconds: float = 0.5,  # Check clipboard frequently
        max_samples: int = 1000,
        retention_hours: int = 24,
        resource_limits: Optional[Dict[str, float]] = None,
        max_content_length: int = 10000,  # Maximum length of clipboard content to store
        content_filters: List[Pattern] = None,  # Regex patterns to filter sensitive content
        hash_content: bool = True,  # Whether to store content hashes instead of raw content
        excluded_content_types: List[str] = None,  # Content types to exclude
        mcp_enabled: bool = True,
        mcp_notification_batch_size: int = 20,
        mcp_notification_interval: float = 1.0,
        privacy_mode: bool = True  # Enhanced privacy controls
    ):
        super().__init__(
            interval_seconds=interval_seconds,
            max_samples=max_samples,
            retention_hours=retention_hours,
            resource_limits=resource_limits or {
                "memory_mb": 100,
                "cpu_percent": 5,
                "max_batch_size_kb": 500
            },
            mcp_enabled=mcp_enabled,
            mcp_notification_batch_size=mcp_notification_batch_size,
            mcp_notification_interval=mcp_notification_interval
        )
        self.max_content_length = max_content_length
        self.content_filters = content_filters or []
        self.hash_content = hash_content
        self.excluded_content_types = excluded_content_types or []
        self.privacy_mode = privacy_mode

class ContentFilter(BaseModel):
    """Model for content filter configuration."""
    pattern: str
    description: str
    priority: int = Field(default=0)
    enabled: bool = Field(default=True)
    replacement: str = Field(default="[FILTERED]")

class ClipboardMetric(MonitoringMetric):
    """Model for clipboard metrics with enhanced MCP support."""
    content_hash: str
    content_type: str
    content_length: int
    filtered_content: Optional[str] = None
    is_filtered: bool = False
    filter_matches: List[str] = Field(default_factory=list)
    client_capabilities: Optional[Dict[str, Any]] = Field(default=None)
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class ClipboardService(MonitoringService):
    """Service for monitoring clipboard activity with MCP protocol support."""
    
    def __init__(self, config: Optional[ClipboardConfig] = None):
        super().__init__(config or ClipboardConfig())
        self._config: ClipboardConfig = self.config
        self._logger = logging.getLogger(__name__)
        self._last_content_hash: Optional[str] = None
        self._client_capabilities: Dict[str, Dict[str, Any]] = {}
        self._content_filters: List[ContentFilter] = []
        self._initialize_filters()
        self._metrics_lock = asyncio.Lock()
    
    def _initialize_filters(self) -> None:
        """Initialize default content filters with enhanced security."""
        if not self._content_filters:
            default_filters = [
                ContentFilter(
                    pattern=r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                    description="Email address",
                    priority=1
                ),
                ContentFilter(
                    pattern=r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
                    description="Phone number",
                    priority=1
                ),
                ContentFilter(
                    pattern=r'\b\d{3}[-]?\d{2}[-]?\d{4}\b',
                    description="SSN",
                    priority=2,
                    replacement="[SENSITIVE-SSN]"
                ),
                ContentFilter(
                    pattern=r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b',
                    description="Credit card",
                    priority=2,
                    replacement="[SENSITIVE-CC]"
                ),
                ContentFilter(
                    pattern=r'password\s*[:=]?\s*\S+',
                    description="Password",
                    priority=2,
                    replacement="[SENSITIVE-PWD]"
                ),
                ContentFilter(
                    pattern=r'api[_-]?key\s*[:=]?\s*\S+',
                    description="API key",
                    priority=2,
                    replacement="[SENSITIVE-KEY]"
                ),
                ContentFilter(
                    pattern=r'token\s*[:=]?\s*\S+',
                    description="Token",
                    priority=2,
                    replacement="[SENSITIVE-TOKEN]"
                ),
                ContentFilter(
                    pattern=r'bearer\s+[A-Za-z0-9-._~+/]+=*',
                    description="Bearer token",
                    priority=2,
                    replacement="[SENSITIVE-BEARER]"
                )
            ]
            
            for filter_config in default_filters:
                self.add_content_filter(
                    filter_config.pattern,
                    filter_config.description,
                    filter_config.priority,
                    filter_config.replacement
                )
    
    def _filter_content(self, content: str) -> Tuple[str, bool, List[str]]:
        """Filter sensitive information from content with enhanced tracking."""
        filtered_content = content
        is_filtered = False
        filter_matches = []
        
        # Sort filters by priority
        sorted_filters = sorted(
            self._content_filters,
            key=lambda f: f.priority,
            reverse=True
        )
        
        for filter_config in sorted_filters:
            if not filter_config.enabled:
                continue
                
            try:
                pattern = re.compile(filter_config.pattern, re.IGNORECASE)
                matches = pattern.finditer(filtered_content)
                
                for match in matches:
                    is_filtered = True
                    filter_matches.append(filter_config.description)
                    filtered_content = filtered_content[:match.start()] + \
                                    filter_config.replacement + \
                                    filtered_content[match.end():]
                    
            except Exception as e:
                self._logger.error(
                    "filter_pattern_error",
                    pattern=filter_config.pattern,
                    error=str(e),
                    exc_info=True
                )
        
        return filtered_content, is_filtered, filter_matches
    
    def _get_content_type(self, content: str) -> str:
        """Determine the type of clipboard content with enhanced detection."""
        if not content:
            return "empty"
        
        # Check for common content types
        if re.match(r'^https?://', content):
            return "url"
        elif re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', content):
            return "email"
        elif re.match(r'^\s*[{[].*[}\]]\s*$', content, re.DOTALL):
            try:
                import json
                json.loads(content)
                return "json"
            except:
                pass
        elif re.match(r'^[A-Fa-f0-9]+$', content):
            return "hex"
        elif re.match(r'^\s*<[^>]+>', content):
            return "xml/html"
        elif '\n' in content:
            return "multiline"
        
        return "text"
    
    async def collect_metric(self) -> Optional[ClipboardMetric]:
        """Collect clipboard metrics with enhanced privacy and error handling."""
        try:
            # Get current clipboard content
            content = pyperclip.paste()
            
            # Skip if content hasn't changed
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            if content_hash == self._last_content_hash:
                return None
            
            self._last_content_hash = content_hash
            
            # Check content size
            content_size_kb = len(content.encode()) / 1024
            if content_size_kb > self._config.resource_limits["max_batch_size_kb"]:
                self._logger.warning(
                    "content_size_limit_exceeded",
                    size_kb=content_size_kb,
                    limit_kb=self._config.resource_limits["max_batch_size_kb"]
                )
                content = content[:self._config.max_content_length] + "..."
            
            # Determine content type
            content_type = self._get_content_type(content)
            
            # Skip excluded content types
            if content_type in self._config.excluded_content_types:
                return None
            
            # Filter sensitive information
            filtered_content, is_filtered, filter_matches = self._filter_content(content)
            
            # Create metric with enhanced privacy
            metric_data = {
                "timestamp": datetime.now(UTC),
                "metric_type": "clipboard",
                "value": filtered_content if not self._config.hash_content else None,
                "content_hash": content_hash,
                "content_type": content_type,
                "content_length": len(content),
                "is_filtered": is_filtered,
                "filter_matches": filter_matches,
                "filtered_content": filtered_content if not self._config.hash_content else None,
                "metadata": {
                    "is_truncated": len(content) > self._config.max_content_length,
                    "original_length": len(content),
                    "privacy_mode": self._config.privacy_mode
                },
                "client_capabilities": self._get_client_capabilities()
            }
            
            metric = ClipboardMetric(**metric_data)
            
            self._logger.debug(
                "clipboard_content_collected",
                content_type=content_type,
                is_filtered=is_filtered,
                filter_matches=filter_matches,
                content_length=len(content)
            )
            
            return metric
            
        except Exception as e:
            self._logger.error(
                "clipboard_collection_error",
                error=str(e),
                exc_info=True
            )
            return None
    
    async def _get_resource_usage(self) -> Dict[str, float]:
        """Get current resource usage with enhanced metrics."""
        usage = await super()._get_resource_usage()
        
        try:
            async with self._metrics_lock:
                if self._metrics:
                    total_content_size = sum(
                        metric.content_length for metric in self._metrics
                        if isinstance(metric, ClipboardMetric)
                    )
                    usage.update({
                        "clipboard_content_size_kb": total_content_size / 1024,
                        "filtered_content_ratio": sum(
                            1 for m in self._metrics
                            if isinstance(m, ClipboardMetric) and m.is_filtered
                        ) / len(self._metrics)
                    })
        except Exception as e:
            self._logger.error(
                "resource_usage_error",
                error=str(e),
                exc_info=True
            )
            
        return usage
    
    def register_client(self, client_id: str, capabilities: Dict[str, Any]) -> None:
        """Register a client with its capabilities."""
        self._client_capabilities[client_id] = capabilities
        self._logger.info(
            "client_registered",
            client_id=client_id,
            capabilities=capabilities
        )
    
    def unregister_client(self, client_id: str) -> None:
        """Unregister a client."""
        if client_id in self._client_capabilities:
            del self._client_capabilities[client_id]
            self._logger.info(
                "client_unregistered",
                client_id=client_id
            )
    
    def _get_client_capabilities(self) -> Optional[Dict[str, Any]]:
        """Get combined client capabilities."""
        if not self._client_capabilities:
            return None
        
        combined = {}
        for capabilities in self._client_capabilities.values():
            combined.update(capabilities)
        return combined
    
    def add_content_filter(
        self,
        pattern: str,
        description: str,
        priority: int = 0,
        replacement: str = "[FILTERED]"
    ) -> None:
        """Add a new content filter with enhanced configuration."""
        try:
            # Validate pattern by attempting to compile it
            re.compile(pattern, re.IGNORECASE)
            
            filter_config = ContentFilter(
                pattern=pattern,
                description=description,
                priority=priority,
                replacement=replacement
            )
            
            self._content_filters.append(filter_config)
            
            self._logger.info(
                "content_filter_added",
                pattern=pattern,
                description=description,
                priority=priority
            )
            
        except re.error as e:
            raise ValueError(f"Invalid regex pattern '{pattern}': {str(e)}")
        except Exception as e:
            self._logger.error(
                "filter_addition_error",
                pattern=pattern,
                error=str(e),
                exc_info=True
            )
            raise
    
    def remove_content_filter(self, pattern: str) -> None:
        """Remove a content filter by pattern."""
        self._content_filters = [
            f for f in self._content_filters
            if f.pattern != pattern
        ]
        
        self._logger.info(
            "content_filter_removed",
            pattern=pattern
        )
    
    def clear_content_filters(self) -> None:
        """Clear all content filters and reinitialize defaults."""
        self._content_filters = []
        self._initialize_filters()
        
        self._logger.info("content_filters_cleared")
    
    async def get_metrics(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        metric_type: Optional[str] = None,
        client_id: Optional[str] = None,
        content_type: Optional[str] = None,
        min_length: Optional[int] = None,
        is_filtered: Optional[bool] = None
    ) -> List[ClipboardMetric]:
        """Get metrics with enhanced filtering options."""
        metrics = await super().get_metrics(start_time, end_time, metric_type, client_id)
        
        # Additional clipboard-specific filtering
        if content_type:
            metrics = [
                m for m in metrics
                if isinstance(m, ClipboardMetric) and m.content_type == content_type
            ]
            
        if min_length is not None:
            metrics = [
                m for m in metrics
                if isinstance(m, ClipboardMetric) and m.content_length >= min_length
            ]
            
        if is_filtered is not None:
            metrics = [
                m for m in metrics
                if isinstance(m, ClipboardMetric) and m.is_filtered == is_filtered
            ]
        
        return metrics 