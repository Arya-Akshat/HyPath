"""Tests for core models."""

import pytest
from backend.core.models import (
    Packet, Protocol, PacketPriority, PacketType, PathMetrics
)


def test_packet_creation():
    """Test packet creation and checksum."""
    packet = Packet(
        packet_id="test-1",
        sequence_number=0,
        timestamp=1234567890.0,
        protocol_used=Protocol.TCP,
        priority=PacketPriority.CRITICAL,
        payload=b"test data"
    )
    
    assert packet.packet_id == "test-1"
    assert packet.sequence_number == 0
    assert packet.protocol_used == Protocol.TCP
    assert packet.priority == PacketPriority.CRITICAL
    assert packet.checksum != ""


def test_packet_checksum_verification():
    """Test packet checksum verification."""
    packet = Packet(
        packet_id="test-2",
        sequence_number=0,
        timestamp=1234567890.0,
        protocol_used=Protocol.UDP,
        priority=PacketPriority.BULK,
        payload=b"test data"
    )
    
    assert packet.verify_checksum() is True
    
    # Corrupt checksum
    packet.checksum = "invalid"
    assert packet.verify_checksum() is False


def test_packet_serialization():
    """Test packet serialization and deserialization."""
    original = Packet(
        packet_id="test-3",
        sequence_number=5,
        timestamp=1234567890.0,
        protocol_used=Protocol.TCP,
        priority=PacketPriority.REALTIME,
        payload=b"test payload"
    )
    
    # Serialize
    data = original.serialize()
    assert isinstance(data, bytes)
    
    # Deserialize
    restored = Packet.deserialize(data)
    assert restored.packet_id == original.packet_id
    assert restored.sequence_number == original.sequence_number
    assert restored.protocol_used == original.protocol_used
    assert restored.priority == original.priority
    assert restored.payload == original.payload


def test_path_metrics_score():
    """Test path metrics score calculation."""
    metrics = PathMetrics(
        path_id=0,
        protocol=Protocol.TCP,
        rtt=0.05,
        loss_rate=0.01,
        jitter=0.002,
        throughput=50.0,
        congestion_level=0.1
    )
    
    score = metrics.calculate_score()
    assert 0 <= score <= 100
    assert score > 50  # Should be decent with these metrics


def test_path_metrics_rtt_update():
    """Test RTT exponential moving average."""
    metrics = PathMetrics(path_id=0, protocol=Protocol.TCP)
    metrics.rtt = 0.1
    
    metrics.update_rtt(0.2)
    assert 0.1 < metrics.rtt < 0.2  # Should be between old and new


def test_path_metrics_loss_rate():
    """Test loss rate calculation."""
    metrics = PathMetrics(path_id=0, protocol=Protocol.UDP)
    metrics.packets_sent = 100
    metrics.packets_lost = 5
    
    metrics.update_loss_rate()
    assert metrics.loss_rate == 0.05
