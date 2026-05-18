"""Tests for simulation engine state resetting."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from backend.core.models import Protocol, Packet, PacketPriority
from backend.core.simulation_engine import SimulationEngine


@pytest.mark.asyncio
async def test_simulation_engine_resets_on_start():
    """Test that starting the simulation resets the statistics."""
    engine = SimulationEngine()
    
    # Mock transport methods so they don't open real sockets
    engine.tcp_server.start = AsyncMock()
    engine.udp_server.start = AsyncMock()
    engine.tcp_client.connect = AsyncMock()
    engine.udp_client.connect = AsyncMock()
    
    # Simulate some initial traffic metrics
    engine.scheduler.stats["tcp_packets"] = 5
    engine.scheduler.stats["udp_packets"] = 5
    engine.scheduler.stats["total_packets"] = 10
    
    engine.retransmission_mgr.stats["retransmissions"] = 3
    engine.reassembly_engine.stats["packets_reassembled"] = 8
    
    # Start the simulation (should trigger reset)
    await engine.start()
    
    # Verify everything was reset
    assert engine.scheduler.stats["tcp_packets"] == 0
    assert engine.scheduler.stats["udp_packets"] == 0
    assert engine.scheduler.stats["total_packets"] == 0
    assert engine.retransmission_mgr.stats["retransmissions"] == 0
    assert engine.reassembly_engine.stats["packets_reassembled"] == 0
    
    # Clean up
    engine.running = False


def test_simulation_engine_resets_on_mode_change_while_running():
    """Test that changing mode while running resets statistics and starts a new session."""
    engine = SimulationEngine()
    engine.running = True  # Pretend it is running
    
    # Simulate initial metrics
    engine.scheduler.stats["tcp_packets"] = 10
    engine.scheduler.stats["total_packets"] = 10
    engine.retransmission_mgr.stats["retransmissions"] = 2
    
    old_session_id = engine.session_id
    
    # Change mode
    engine.set_mode(Protocol.UDP)
    
    # Verify everything was reset and a new session was created
    assert engine.session_id != old_session_id
    assert engine.scheduler.stats["tcp_packets"] == 0
    assert engine.scheduler.stats["total_packets"] == 0
    assert engine.retransmission_mgr.stats["retransmissions"] == 0
