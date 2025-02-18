from typing import Dict, Any, List, Type
import asyncio
import logging
from datetime import datetime

from .orchestrator import Workflow
from services.monitoring.base import MonitoringService
from services.monitoring.screenshot.service import ScreenshotService, ScreenshotConfig
from services.monitoring.network.service import NetworkService, NetworkConfig
from services.monitoring.clipboard.service import ClipboardService, ClipboardConfig

class SystemMonitoringWorkflow(Workflow):
    """Workflow for coordinating system monitoring services."""
    
    def __init__(self):
        self._services: Dict[str, MonitoringService] = {}
        self._logger = logging.getLogger(__name__)
        self._running = False
    
    def get_requirements(self) -> List[str]:
        """Get required context keys."""
        return [
            "monitoring_config",
            "enabled_services"
        ]
    
    async def validate(self, context: Dict[str, Any]) -> bool:
        """Validate workflow context."""
        try:
            config = context.get("monitoring_config", {})
            enabled_services = context.get("enabled_services", [])
            
            # Validate monitoring configuration
            if not isinstance(config, dict):
                self._logger.error("monitoring_config must be a dictionary")
                return False
                
            # Validate enabled services
            if not isinstance(enabled_services, list):
                self._logger.error("enabled_services must be a list")
                return False
                
            # Validate service configurations
            for service_name in enabled_services:
                service_config = config.get(service_name)
                if not service_config:
                    self._logger.error(f"Missing configuration for service: {service_name}")
                    return False
            
            return True
            
        except Exception as e:
            self._logger.error(f"Error validating context: {str(e)}", exc_info=True)
            return False
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the monitoring workflow."""
        try:
            config = context["monitoring_config"]
            enabled_services = context["enabled_services"]
            
            # Initialize services
            await self._initialize_services(config, enabled_services)
            
            # Start monitoring
            await self._start_monitoring()
            
            # Return initial state
            return {
                "status": "monitoring_started",
                "active_services": list(self._services.keys()),
                "start_time": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self._logger.error(f"Error executing workflow: {str(e)}", exc_info=True)
            await self._cleanup()
            raise
    
    async def _initialize_services(self, config: Dict[str, Any], enabled_services: List[str]) -> None:
        """Initialize monitoring services."""
        service_map = {
            "screenshot": (ScreenshotService, ScreenshotConfig),
            "network": (NetworkService, NetworkConfig),
            "clipboard": (ClipboardService, ClipboardConfig)
        }
        
        for service_name in enabled_services:
            if service_name not in service_map:
                raise ValueError(f"Unknown service: {service_name}")
                
            service_class, config_class = service_map[service_name]
            service_config = config.get(service_name, {})
            
            try:
                # Create configuration object
                config_obj = config_class(**service_config)
                service = service_class(config_obj)
                self._services[service_name] = service
                self._logger.info(f"Initialized {service_name} service")
            except Exception as e:
                self._logger.error(f"Error initializing {service_name} service: {str(e)}", exc_info=True)
                await self._cleanup()
                raise
    
    async def _start_monitoring(self) -> None:
        """Start all monitoring services."""
        if self._running:
            return
            
        self._running = True
        start_tasks = []
        
        for service_name, service in self._services.items():
            try:
                start_tasks.append(service.start())
                self._logger.info(f"Starting {service_name} service")
            except Exception as e:
                self._logger.error(f"Error starting {service_name} service: {str(e)}", exc_info=True)
                await self._cleanup()
                raise
        
        if start_tasks:
            await asyncio.gather(*start_tasks)
    
    async def _cleanup(self) -> None:
        """Clean up all services."""
        self._running = False
        cleanup_tasks = []
        
        for service_name, service in self._services.items():
            try:
                cleanup_tasks.append(service.stop())
                self._logger.info(f"Stopping {service_name} service")
            except Exception as e:
                self._logger.error(f"Error stopping {service_name} service: {str(e)}", exc_info=True)
        
        if cleanup_tasks:
            await asyncio.gather(*cleanup_tasks)
        
        self._services.clear()
    
    async def stop(self) -> None:
        """Stop the monitoring workflow."""
        await self._cleanup()
    
    def __del__(self):
        """Ensure cleanup on deletion."""
        if self._running:
            asyncio.create_task(self._cleanup()) 