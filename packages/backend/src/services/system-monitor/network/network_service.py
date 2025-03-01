from typing import Optional, Dict, Any, List
import asyncio
from datetime import datetime
import psutil
from pydantic import BaseModel

class NetworkConfig(BaseModel):
    """Configuration for network monitoring."""
    interval: float = 1.0  # Seconds between captures
    capture_connections: bool = True
    capture_io_counters: bool = True
    max_connections: int = 1000
    include_processes: bool = True

class NetworkStats(BaseModel):
    """Model for network statistics."""
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int
    errin: int
    errout: int
    dropin: int
    dropout: int

class NetworkConnection(BaseModel):
    """Model for network connection data."""
    fd: Optional[int]
    family: str
    type: str
    laddr: str
    raddr: Optional[str]
    status: str
    pid: Optional[int]
    process_name: Optional[str]

class NetworkData(BaseModel):
    """Model for network monitoring data."""
    timestamp: datetime
    stats: Dict[str, NetworkStats]
    connections: List[NetworkConnection]
    metadata: Optional[Dict[str, Any]] = None

class NetworkService:
    """
    Service for monitoring network activity with security measures
    and resource management.
    """

    def __init__(self, config: NetworkConfig):
        self._config = config
        self._running = False
        self._last_capture: Optional[NetworkData] = None
        self._lock = asyncio.Lock()
        self._subscribers: List[callable] = []

    async def start_monitoring(self) -> None:
        """Start network monitoring."""
        async with self._lock:
            if self._running:
                return
            self._running = True

        while self._running:
            try:
                network_data = await self.capture_network_data()
                await self._notify_subscribers(network_data)
            except Exception as e:
                print(f"Error capturing network data: {e}")
            
            await asyncio.sleep(self._config.interval)

    async def stop_monitoring(self) -> None:
        """Stop network monitoring."""
        async with self._lock:
            self._running = False

    async def capture_network_data(self) -> NetworkData:
        """
        Capture current network data with security measures.
        Returns network statistics and active connections.
        """
        # Capture network I/O statistics
        stats = {}
        if self._config.capture_io_counters:
            net_io = psutil.net_io_counters(pernic=True)
            for nic, io_data in net_io.items():
                stats[nic] = NetworkStats(
                    bytes_sent=io_data.bytes_sent,
                    bytes_recv=io_data.bytes_recv,
                    packets_sent=io_data.packets_sent,
                    packets_recv=io_data.packets_recv,
                    errin=io_data.errin,
                    errout=io_data.errout,
                    dropin=io_data.dropin,
                    dropout=io_data.dropout
                )

        # Capture network connections
        connections = []
        if self._config.capture_connections:
            net_connections = psutil.net_connections()
            for conn in net_connections[:self._config.max_connections]:
                try:
                    process_name = None
                    if conn.pid and self._config.include_processes:
                        try:
                            process = psutil.Process(conn.pid)
                            process_name = process.name()
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass

                    connections.append(NetworkConnection(
                        fd=conn.fd,
                        family=str(conn.family),
                        type=str(conn.type),
                        laddr=f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else "",
                        raddr=f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                        status=conn.status,
                        pid=conn.pid,
                        process_name=process_name
                    ))
                except Exception as e:
                    print(f"Error processing connection: {e}")
                    continue

        # Create network data
        network_data = NetworkData(
            timestamp=datetime.utcnow(),
            stats=stats,
            connections=connections,
            metadata={
                "total_connections": len(connections),
                "interfaces": list(stats.keys())
            }
        )

        async with self._lock:
            self._last_capture = network_data

        return network_data

    async def get_last_capture(self) -> Optional[NetworkData]:
        """Get the most recent network capture."""
        async with self._lock:
            return self._last_capture

    async def subscribe(self, callback: callable) -> None:
        """Subscribe to network updates."""
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    async def unsubscribe(self, callback: callable) -> None:
        """Unsubscribe from network updates."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    async def _notify_subscribers(self, data: NetworkData) -> None:
        """Notify subscribers of network updates."""
        for subscriber in self._subscribers:
            try:
                await subscriber(data)
            except Exception as e:
                print(f"Error notifying subscriber: {e}")

    @property
    def is_running(self) -> bool:
        """Check if the service is currently running."""
        return self._running

    def update_config(self, config: NetworkConfig) -> None:
        """Update service configuration."""
        self._config = config 