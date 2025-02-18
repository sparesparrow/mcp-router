import pytest
import asyncio
import os
from typing import Dict, Any
from datetime import datetime

from services.monitoring.screenshot.service import ScreenshotService, ScreenshotConfig
from services.monitoring.network.service import NetworkService, NetworkConfig
from services.monitoring.clipboard.service import ClipboardService, ClipboardConfig

# Screenshot Service Tests
@pytest.fixture
async def screenshot_service(base_monitoring_config):
    """Create a screenshot service instance for testing."""
    config = ScreenshotConfig(**base_monitoring_config["screenshot"])
    service = ScreenshotService(config)
    yield service
    await service.stop()

@pytest.mark.asyncio
async def test_screenshot_service(screenshot_service: ScreenshotService):
    """Test screenshot service functionality."""
    try:
        # Start service
        await screenshot_service.start()
        assert screenshot_service.is_running

        # Wait for metrics collection
        await asyncio.sleep(0.2)

        # Check metrics
        metrics = await screenshot_service.get_metrics()
        assert len(metrics) > 0

        # Verify screenshot files
        for metric in metrics:
            assert os.path.exists(metric.file_path)
            assert metric.dimensions["width"] <= screenshot_service._config.max_dimension
            assert metric.dimensions["height"] <= screenshot_service._config.max_dimension

        # Check resource usage
        usage = await screenshot_service._get_resource_usage()
        assert "memory_mb" in usage
        assert "disk_usage_mb" in usage

    finally:
        await screenshot_service.stop()
        assert not screenshot_service.is_running

# Network Service Tests
@pytest.fixture
async def network_service(base_monitoring_config):
    """Create a network service instance for testing."""
    config = NetworkConfig(**base_monitoring_config["network"])
    service = NetworkService(config)
    yield service
    await service.stop()

@pytest.mark.asyncio
async def test_network_service(network_service: NetworkService):
    """Test network service functionality."""
    try:
        # Start service
        await network_service.start()
        assert network_service.is_running

        # Wait for metrics collection
        await asyncio.sleep(0.2)

        # Check metrics
        metrics = await network_service.get_metrics()
        assert len(metrics) > 0

        # Verify network metrics
        for metric in metrics:
            if network_service._config.capture_connections:
                assert metric.connections is not None
            if network_service._config.capture_io_counters:
                assert metric.io_counters is not None
                assert "bytes_sent" in metric.io_counters
                assert "bytes_recv" in metric.io_counters

        # Check interface information
        interfaces = await network_service._collect_interfaces()
        assert isinstance(interfaces, list)

        # Check resource usage
        usage = await network_service._get_resource_usage()
        assert "memory_mb" in usage
        assert "network_bytes_sent" in usage
        assert "network_bytes_recv" in usage

    finally:
        await network_service.stop()
        assert not network_service.is_running

# Clipboard Service Tests
@pytest.fixture
async def clipboard_service(base_monitoring_config):
    """Create a clipboard service instance for testing."""
    config = ClipboardConfig(**base_monitoring_config["clipboard"])
    service = ClipboardService(config)
    yield service
    await service.stop()

@pytest.mark.asyncio
async def test_clipboard_service(clipboard_service: ClipboardService):
    """Test clipboard service functionality."""
    import pyperclip
    
    try:
        # Start service
        await clipboard_service.start()
        assert clipboard_service.is_running

        # Test with different content types
        test_contents = [
            "Hello, World!",  # text
            "https://example.com",  # url
            "test@example.com",  # email
            "1234-5678-9012-3456",  # credit card (should be filtered)
            '{"key": "value"}',  # json
            "password: secret123"  # sensitive (should be filtered)
        ]

        for content in test_contents:
            # Set clipboard content
            pyperclip.copy(content)
            await asyncio.sleep(0.1)  # Wait for collection

            # Get latest metrics
            metrics = await clipboard_service.get_metrics()
            if metrics:
                latest_metric = metrics[-1]
                
                # Verify content type detection
                assert latest_metric.content_type in [
                    "text", "url", "email", "json", "multiline", "hex"
                ]

                # Verify content filtering
                if any(pattern.search(content) for pattern in clipboard_service._config.content_filters):
                    assert latest_metric.is_filtered
                    if not clipboard_service._config.hash_content:
                        assert "[FILTERED]" in latest_metric.filtered_content

                # Verify content length limits
                assert latest_metric.content_length <= clipboard_service._config.max_content_length

        # Check resource usage
        usage = await clipboard_service._get_resource_usage()
        assert "memory_mb" in usage
        assert "clipboard_content_size_kb" in usage

    finally:
        await clipboard_service.stop()
        assert not clipboard_service.is_running

@pytest.mark.asyncio
async def test_clipboard_content_filters(clipboard_service: ClipboardService):
    """Test clipboard content filtering functionality."""
    # Add custom filter
    clipboard_service.add_content_filter(r"secret\s*data")
    
    # Test filtering
    test_cases = [
        ("secret data 123", True),  # Should be filtered
        ("normal text", False),  # Should not be filtered
        ("PASSWORD: mysecret", True),  # Should be filtered (default filter)
        ("1234-5678-9012-3456", True),  # Should be filtered (credit card)
        ("api_key=abcdef123", True)  # Should be filtered (default filter)
    ]

    for content, should_filter in test_cases:
        filtered_content, is_filtered = clipboard_service._filter_content(content)
        assert is_filtered == should_filter
        if should_filter:
            assert "[FILTERED]" in filtered_content

    # Test clear filters
    clipboard_service.clear_content_filters()
    assert len(clipboard_service._config.content_filters) > 0  # Should reinitialize default filters 