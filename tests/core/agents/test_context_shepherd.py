import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any

from core.agents.context_shepherd import ContextShepherd, ContextData

@pytest.fixture
async def shepherd():
    """Create a new ContextShepherd instance for each test."""
    return ContextShepherd()

@pytest.mark.asyncio
async def test_add_context(shepherd: ContextShepherd):
    """Test adding context data."""
    # Test data
    source = "test_source"
    content = {"key": "value"}
    importance = 0.8

    # Add context
    await shepherd.add_context(source, content, importance)

    # Verify context was added
    context = await shepherd.get_current_context(source)
    assert source in context
    assert context[source].content == content
    assert context[source].importance == importance
    assert isinstance(context[source].timestamp, datetime)

@pytest.mark.asyncio
async def test_add_invalid_context(shepherd: ContextShepherd):
    """Test adding invalid context data."""
    # Test invalid importance
    with pytest.raises(ValueError):
        await shepherd.add_context("test", {"data": "value"}, importance=1.5)

    # Test empty source
    with pytest.raises(ValueError):
        await shepherd.add_context("", {"data": "value"})

    # Test oversized content
    large_content = "x" * 2_000_000  # 2MB of data
    with pytest.raises(ValueError):
        await shepherd.add_context("test", large_content)

@pytest.mark.asyncio
async def test_get_context(shepherd: ContextShepherd):
    """Test retrieving context data."""
    # Add multiple context entries
    sources = ["source1", "source2"]
    data = [
        {"key1": "value1"},
        {"key2": "value2"}
    ]

    for source, content in zip(sources, data):
        await shepherd.add_context(source, content)

    # Get all context
    context = await shepherd.get_current_context()
    assert len(context) == 2
    assert all(source in context for source in sources)

    # Get specific source
    source1_context = await shepherd.get_current_context("source1")
    assert len(source1_context) == 1
    assert "source1" in source1_context
    assert source1_context["source1"].content == data[0]

@pytest.mark.asyncio
async def test_context_subscription(shepherd: ContextShepherd):
    """Test context update subscription system."""
    received_updates = []

    async def update_handler(source: str, data: ContextData):
        received_updates.append((source, data))

    # Subscribe to updates
    await shepherd.subscribe(update_handler)

    # Add context and verify notification
    test_source = "test_source"
    test_content = {"test": "data"}
    
    await shepherd.add_context(test_source, test_content)
    
    # Wait a bit for async notification
    await asyncio.sleep(0.1)
    
    assert len(received_updates) == 1
    assert received_updates[0][0] == test_source
    assert received_updates[0][1].content == test_content

    # Unsubscribe and verify no more notifications
    await shepherd.unsubscribe(update_handler)
    await shepherd.add_context("another_source", {"more": "data"})
    
    await asyncio.sleep(0.1)
    
    assert len(received_updates) == 1  # Still only one update

@pytest.mark.asyncio
async def test_cleanup_old_context(shepherd: ContextShepherd):
    """Test cleaning up old context data."""
    # Add context
    await shepherd.add_context("test1", {"data": "value1"})
    await shepherd.add_context("test2", {"data": "value2"})

    # Verify initial state
    context = await shepherd.get_current_context()
    assert len(context) == 2

    # Clean up with very short max age
    await shepherd.cleanup_old_context(max_age_hours=0)

    # Verify cleanup
    context = await shepherd.get_current_context()
    assert len(context) == 0

@pytest.mark.asyncio
async def test_reflect(shepherd: ContextShepherd):
    """Test reflection capabilities."""
    # Add some context
    await shepherd.add_context("source1", {"data": "value1"})
    await shepherd.add_context("source2", {"data": "value2"})

    # Add a subscriber
    async def dummy_handler(source: str, data: ContextData):
        pass
    await shepherd.subscribe(dummy_handler)

    # Get reflection data
    reflection = await shepherd.reflect()

    # Verify reflection data
    assert reflection["total_sources"] == 2
    assert len(reflection["sources"]) == 2
    assert reflection["subscriber_count"] == 1
    assert isinstance(reflection["latest_update"], datetime) 