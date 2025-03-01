from typing import Dict, Any, Optional, List
import asyncio
import logging
from datetime import datetime, UTC
import psutil
import socket
from pydantic import BaseModel, Field
from ..base import MonitoringService, MonitoringMetric, MonitoringConfig, MCPNotification

class NetworkConfig(MonitoringConfig):
    """Configuration for network monitoring with MCP support."""
    def __init__(
        self,
        interval_seconds: float = 1.0,
        max_samples: int = 3600,  # 1 hour at 1 second intervals
        retention_hours: int = 24,
        resource_limits: Optional[Dict[str, float]] = None,
        capture_connections: bool = True,
        capture_io_counters: bool = True,
        excluded_ports: List[int] = None,
        excluded_processes: List[str] = None,
        mcp_enabled: bool = True,
        mcp_notification_batch_size: int = 50,
        mcp_notification_interval: float = 1.0
    ):
        super().__init__(
            interval_seconds=interval_seconds,
            max_samples=max_samples,
            retention_hours=retention_hours,
            resource_limits=resource_limits or {
                "memory_mb": 200,
                "cpu_percent": 10,
                "network_bandwidth_mbps": 100
            },
            mcp_enabled=mcp_enabled,
            mcp_notification_batch_size=mcp_notification_batch_size,
            mcp_notification_interval=mcp_notification_interval
        )
        self.capture_connections = capture_connections
        self.capture_io_counters = capture_io_counters
        self.excluded_ports = excluded_ports or [0]  # Exclude system ports by default
        self.excluded_processes = excluded_processes or []

class NetworkConnection(BaseModel):
    """Model for network connection information."""
    local_address: str
    remote_address: Optional[str] = None
    status: str
    pid: Optional[int] = None
    process_name: Optional[str] = None
    protocol: str = "TCP"
    established_time: Optional[datetime] = None

class NetworkIOCounters(BaseModel):
    """Model for network IO counter information."""
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int
    errin: int
    errout: int
    dropin: int
    dropout: int
    bandwidth_mbps: float = Field(default=0.0)

class NetworkInterface(BaseModel):
    """Model for network interface information."""
    name: str
    addresses: List[str]
    is_up: bool
    speed_mbps: Optional[int] = None
    mtu: Optional[int] = None
    duplex: Optional[str] = None

class NetworkMetric(MonitoringMetric):
    """Model for network metrics with enhanced MCP support."""
    connections: Optional[List[NetworkConnection]] = None
    io_counters: Optional[NetworkIOCounters] = None
    active_interfaces: List[NetworkInterface]
    client_capabilities: Optional[Dict[str, Any]] = Field(default=None)
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class NetworkService(MonitoringService):
    """Service for monitoring network activity with MCP protocol support."""
    
    def __init__(self, config: Optional[NetworkConfig] = None):
        super().__init__(config or NetworkConfig())
        self._config: NetworkConfig = self.config  # Type hint for specific config
        self._logger = logging.getLogger(__name__)
        self._hostname = socket.gethostname()
        self._client_capabilities: Dict[str, Dict[str, Any]] = {}
        self._last_io_counters: Optional[Dict[str, int]] = None
        self._last_io_time: Optional[datetime] = None
    
    async def collect_metric(self) -> NetworkMetric:
        """Collect network metrics with enhanced error handling and rate limiting."""
        try:
            # Check resource limits before collection
            await self._check_bandwidth_usage()
            
            metric_data: Dict[str, Any] = {
                "timestamp": datetime.now(UTC),
                "metric_type": "network",
                "value": {},
                "metadata": {
                    "hostname": self._hostname,
                    "collection_time": datetime.now(UTC).isoformat()
                }
            }
            
            # Collect network connections if enabled
            if self._config.capture_connections:
                connections = await self._collect_connections()
                metric_data["connections"] = connections
                metric_data["value"]["connection_count"] = len(connections)
            
            # Collect IO counters if enabled
            if self._config.capture_io_counters:
                io_counters = await self._collect_io_counters()
                metric_data["io_counters"] = io_counters
                metric_data["value"].update({
                    "total_bytes_sent": io_counters.bytes_sent,
                    "total_bytes_recv": io_counters.bytes_recv,
                    "bandwidth_mbps": io_counters.bandwidth_mbps
                })
            
            # Collect active interfaces
            interfaces = await self._collect_interfaces()
            metric_data["active_interfaces"] = interfaces
            metric_data["value"]["active_interface_count"] = len(interfaces)
            
            # Add client capabilities
            metric_data["client_capabilities"] = self._get_client_capabilities()
            
            metric = NetworkMetric(**metric_data)
            
            self._logger.debug(
                "network_metrics_collected",
                connection_count=len(connections) if self._config.capture_connections else 0,
                bandwidth_mbps=io_counters.bandwidth_mbps if self._config.capture_io_counters else 0,
                active_interfaces=len(interfaces)
            )
            
            return metric
            
        except Exception as e:
            self._logger.error(
                "network_metric_collection_error",
                error=str(e),
                exc_info=True
            )
            raise
    
    async def _collect_connections(self) -> List[NetworkConnection]:
        """Collect network connection information with enhanced details."""
        connections = []
        try:
            for conn in psutil.net_connections(kind='inet'):
                # Skip excluded ports
                if conn.laddr.port in self._config.excluded_ports:
                    continue
                    
                # Get process info if available
                try:
                    process = psutil.Process(conn.pid) if conn.pid else None
                    process_name = process.name() if process else None
                    
                    # Skip excluded processes
                    if process_name in self._config.excluded_processes:
                        continue
                    
                    # Get connection established time if available
                    create_time = process.create_time() if process else None
                    established_time = datetime.fromtimestamp(create_time, UTC) if create_time else None
                        
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    process_name = None
                    established_time = None
                
                connection = NetworkConnection(
                    local_address=f"{conn.laddr.ip}:{conn.laddr.port}",
                    remote_address=f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                    status=conn.status,
                    pid=conn.pid,
                    process_name=process_name,
                    protocol="TCP" if conn.type == socket.SOCK_STREAM else "UDP",
                    established_time=established_time
                )
                connections.append(connection)
                
        except psutil.AccessDenied:
            self._logger.warning(
                "access_denied",
                operation="collect_connections",
                details="Insufficient permissions to collect network connections"
            )
            
        return connections
    
    async def _collect_io_counters(self) -> NetworkIOCounters:
        """Collect network IO counter information with bandwidth calculation."""
        try:
            current_time = datetime.now(UTC)
            counters = psutil.net_io_counters()
            
            io_data = {
                "bytes_sent": counters.bytes_sent,
                "bytes_recv": counters.bytes_recv,
                "packets_sent": counters.packets_sent,
                "packets_recv": counters.packets_recv,
                "errin": counters.errin,
                "errout": counters.errout,
                "dropin": counters.dropin,
                "dropout": counters.dropout,
                "bandwidth_mbps": 0.0
            }
            
            # Calculate bandwidth if we have previous measurements
            if self._last_io_counters and self._last_io_time:
                time_diff = (current_time - self._last_io_time).total_seconds()
                if time_diff > 0:
                    bytes_diff = (
                        (counters.bytes_sent - self._last_io_counters["bytes_sent"]) +
                        (counters.bytes_recv - self._last_io_counters["bytes_recv"])
                    )
                    io_data["bandwidth_mbps"] = (bytes_diff * 8) / (time_diff * 1_000_000)
            
            # Update last measurements
            self._last_io_counters = {
                "bytes_sent": counters.bytes_sent,
                "bytes_recv": counters.bytes_recv
            }
            self._last_io_time = current_time
            
            return NetworkIOCounters(**io_data)
            
        except Exception as e:
            self._logger.error(
                "io_counter_collection_error",
                error=str(e),
                exc_info=True
            )
            return NetworkIOCounters(
                bytes_sent=0, bytes_recv=0, packets_sent=0, packets_recv=0,
                errin=0, errout=0, dropin=0, dropout=0
            )
    
    async def _collect_interfaces(self) -> List[NetworkInterface]:
        """Collect active network interface information with enhanced details."""
        interfaces = []
        try:
            stats = psutil.net_if_stats()
            addresses = psutil.net_if_addrs()
            
            for interface, stats in stats.items():
                if stats.isup:  # Only include active interfaces
                    interface_addresses = [
                        addr.address for addr in addresses.get(interface, [])
                        if addr.family == socket.AF_INET  # IPv4 addresses only
                    ]
                    
                    interface_info = NetworkInterface(
                        name=interface,
                        addresses=interface_addresses,
                        is_up=stats.isup,
                        speed_mbps=stats.speed,
                        mtu=stats.mtu,
                        duplex=stats.duplex if hasattr(stats, 'duplex') else None
                    )
                    interfaces.append(interface_info)
                    
        except Exception as e:
            self._logger.error(
                "interface_collection_error",
                error=str(e),
                exc_info=True
            )
            
        return interfaces
    
    async def _check_bandwidth_usage(self) -> None:
        """Check if bandwidth usage is within limits."""
        if not self._last_io_counters or not self._last_io_time:
            return
            
        current_time = datetime.now(UTC)
        time_diff = (current_time - self._last_io_time).total_seconds()
        
        if time_diff > 0:
            try:
                counters = psutil.net_io_counters()
                bytes_diff = (
                    (counters.bytes_sent - self._last_io_counters["bytes_sent"]) +
                    (counters.bytes_recv - self._last_io_counters["bytes_recv"])
                )
                current_bandwidth_mbps = (bytes_diff * 8) / (time_diff * 1_000_000)
                
                if current_bandwidth_mbps > self._config.resource_limits["network_bandwidth_mbps"]:
                    raise ResourceExhaustion(
                        f"Network bandwidth limit exceeded: {current_bandwidth_mbps:.2f} Mbps > "
                        f"{self._config.resource_limits['network_bandwidth_mbps']} Mbps"
                    )
                    
            except Exception as e:
                if not isinstance(e, ResourceExhaustion):
                    self._logger.error(
                        "bandwidth_check_error",
                        error=str(e),
                        exc_info=True
                    )
    
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
        
        # Combine capabilities from all clients
        combined = {}
        for capabilities in self._client_capabilities.values():
            combined.update(capabilities)
        return combined
    
    async def get_metrics(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        metric_type: Optional[str] = None,
        client_id: Optional[str] = None,
        min_bandwidth_mbps: Optional[float] = None,
        connection_status: Optional[str] = None
    ) -> List[NetworkMetric]:
        """Get metrics with enhanced filtering options."""
        metrics = await super().get_metrics(start_time, end_time, metric_type, client_id)
        
        # Additional network-specific filtering
        if min_bandwidth_mbps is not None:
            metrics = [
                m for m in metrics
                if m.io_counters and m.io_counters.bandwidth_mbps >= min_bandwidth_mbps
            ]
            
        if connection_status:
            metrics = [
                m for m in metrics
                if m.connections and any(c.status == connection_status for c in m.connections)
            ]
        
        return metrics 