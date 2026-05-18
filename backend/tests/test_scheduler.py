"""Tests for adaptive scheduler."""

import pytest
from backend.core.models import (
    Packet, Protocol, PacketPriority, PathMetrics
)
from backend.scheduler.adaptive_scheduler import AdaptiveScheduler


def create_test_packet(priority: PacketPriority) -> Packet:
    """Helper to create test packet."""
    return Packet(
        packet_id="test",
        sequence_number=0,
        timestamp=0.0,
        protocol_used=Protocol.TCP,
        priority=priority,
        payload=b"test"
    )


def test_scheduler_tcp_only_mode():
    """Test TCP-only mode."""
    scheduler = AdaptiveScheduler(mode=Protocol.TCP)
    
    packet = create_test_packet(PacketPriority.BULK)
    protocol = scheduler.select_protocol(packet)
    
    assert protocol == Protocol.TCP


def test_scheduler_udp_only_mode():
    """Test UDP-only mode."""
    scheduler = AdaptiveScheduler(mode=Protocol.UDP)
    
    packet = create_test_packet(PacketPriority.CRITICAL)
    protocol = scheduler.select_protocol(packet)
    
    assert protocol == Protocol.UDP


def test_scheduler_critical_priority():
    """Test critical packets prefer TCP."""
    scheduler = AdaptiveScheduler(mode=Protocol.HYBRID)
    
    packet = create_test_packet(PacketPriority.CRITICAL)
    protocol = scheduler.select_protocol(packet)
    
    assert protocol == Protocol.TCP


def test_scheduler_realtime_priority():
    """Test realtime packets prefer UDP."""
    scheduler = AdaptiveScheduler(mode=Protocol.HYBRID)
    
    # Set good UDP metrics
    scheduler.udp_metrics.rtt = 0.01
    scheduler.udp_metrics.loss_rate = 0.001
    
    packet = create_test_packet(PacketPriority.REALTIME)
    protocol = scheduler.select_protocol(packet)
    
    assert protocol == Protocol.UDP


def test_scheduler_optional_priority():
    """Test optional packets use UDP."""
    scheduler = AdaptiveScheduler(mode=Protocol.HYBRID)
    
    packet = create_test_packet(PacketPriority.OPTIONAL)
    protocol = scheduler.select_protocol(packet)
    
    assert protocol == Protocol.UDP


def test_scheduler_adaptive_routing():
    """Test adaptive routing based on path scores."""
    scheduler = AdaptiveScheduler(mode=Protocol.HYBRID)
    
    # Make TCP significantly better
    scheduler.tcp_metrics.rtt = 0.01
    scheduler.tcp_metrics.loss_rate = 0.001
    scheduler.udp_metrics.rtt = 0.5
    scheduler.udp_metrics.loss_rate = 0.1
    
    packet = create_test_packet(PacketPriority.BULK)
    protocol = scheduler.select_protocol(packet)
    
    # Should prefer TCP due to better metrics
    assert protocol == Protocol.TCP


def test_scheduler_statistics():
    """Test scheduler statistics tracking."""
    scheduler = AdaptiveScheduler(mode=Protocol.HYBRID)
    
    # Send some packets
    for _ in range(10):
        scheduler.select_protocol(create_test_packet(PacketPriority.CRITICAL))
    
    stats = scheduler.get_stats()
    assert stats["total_packets"] == 10
    assert stats["tcp_packets"] == 10  # Critical always uses TCP
