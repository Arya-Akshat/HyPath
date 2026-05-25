"""Network emulator for simulating impairments."""

import random
import time
import asyncio
from typing import Optional
from backend.core.models import Packet, NetworkConditions
import logging

logger = logging.getLogger(__name__)


class NetworkEmulator:
    """Simulates network impairments like latency, loss, jitter, etc."""
    
    def __init__(self, conditions: Optional[NetworkConditions] = None):
        """Initialize network emulator with conditions."""
        self.conditions = conditions or NetworkConditions()
        self.packet_buffer = []
        self.stats = {
            "packets_processed": 0,
            "packets_dropped": 0,
            "packets_delayed": 0,
            "packets_corrupted": 0,
            "packets_duplicated": 0,
            "packets_reordered": 0
        }
    
    def update_conditions(self, conditions: NetworkConditions):
        """Update network conditions dynamically."""
        self.conditions = conditions
        logger.info(f"Network conditions updated: latency={conditions.latency_ms}ms, "
                   f"loss={conditions.packet_loss_rate*100}%, jitter={conditions.jitter_ms}ms")
    
    async def process_packet(self, packet: Packet) -> Optional[Packet]:
        """
        Process packet through network emulator.
        Returns None if packet is dropped.
        """
        self.stats["packets_processed"] += 1
        
        # Packet loss simulation
        if random.random() < self.conditions.packet_loss_rate:
            self.stats["packets_dropped"] += 1
            logger.debug(f"Packet {packet.packet_id} dropped (loss simulation)")
            return None
        
        # Packet corruption simulation
        if random.random() < self.conditions.corruption_rate:
            self.stats["packets_corrupted"] += 1
            packet.checksum = "corrupted"
            logger.debug(f"Packet {packet.packet_id} corrupted")
        
        # Latency and jitter simulation
        base_delay = self.conditions.latency_ms / 1000.0
        jitter = random.uniform(-self.conditions.jitter_ms, self.conditions.jitter_ms) / 1000.0
        total_delay = max(0, base_delay + jitter)
        
        if total_delay > 0:
            self.stats["packets_delayed"] += 1
            await asyncio.sleep(total_delay)
        
        # Packet duplication simulation
        if random.random() < self.conditions.duplication_rate:
            self.stats["packets_duplicated"] += 1
            logger.debug(f"Packet {packet.packet_id} duplicated")
            # Return original, duplicate will be handled separately
        
        # Packet reordering simulation
        if random.random() < self.conditions.reorder_rate:
            self.stats["packets_reordered"] += 1
            # Add small random delay to cause reordering
            await asyncio.sleep(random.uniform(0.01, 0.05))
        
        # Bandwidth throttling is now handled sequentially in the SimulationEngine send loop
        # to correctly model the physical wire bottleneck.
        
        return packet
    
    def inject_congestion(self, level: float):
        """Inject congestion into the network."""
        self.conditions.congestion_level = max(0.0, min(1.0, level))
        # Congestion increases latency and loss
        self.conditions.latency_ms += level * 50
        self.conditions.packet_loss_rate = min(0.5, self.conditions.packet_loss_rate + level * 0.1)
        logger.warning(f"Congestion injected: level={level}")
    
    def get_stats(self) -> dict:
        """Get emulator statistics."""
        return self.stats.copy()
    
    def reset_stats(self):
        """Reset statistics."""
        self.stats = {
            "packets_processed": 0,
            "packets_dropped": 0,
            "packets_delayed": 0,
            "packets_corrupted": 0,
            "packets_duplicated": 0,
            "packets_reordered": 0
        }


class ScenarioEmulator:
    """Predefined network scenarios for testing."""
    
    @staticmethod
    def get_scenario(name: str) -> NetworkConditions:
        """Get predefined network scenario."""
        scenarios = {
            "ideal": NetworkConditions(
                latency_ms=1.0,
                jitter_ms=0.1,
                packet_loss_rate=0.0,
                bandwidth_mbps=1000.0
            ),
            "good": NetworkConditions(
                latency_ms=10.0,
                jitter_ms=2.0,
                packet_loss_rate=0.001,
                bandwidth_mbps=100.0
            ),
            "moderate": NetworkConditions(
                latency_ms=50.0,
                jitter_ms=10.0,
                packet_loss_rate=0.02,
                bandwidth_mbps=50.0
            ),
            "poor": NetworkConditions(
                latency_ms=150.0,
                jitter_ms=30.0,
                packet_loss_rate=0.05,
                bandwidth_mbps=10.0
            ),
            "terrible": NetworkConditions(
                latency_ms=300.0,
                jitter_ms=100.0,
                packet_loss_rate=0.15,
                bandwidth_mbps=1.0
            ),
            "drone_telemetry": NetworkConditions(
                latency_ms=80.0,
                jitter_ms=20.0,
                packet_loss_rate=0.03,
                bandwidth_mbps=20.0
            ),
            "live_streaming": NetworkConditions(
                latency_ms=30.0,
                jitter_ms=5.0,
                packet_loss_rate=0.01,
                bandwidth_mbps=50.0
            ),
            "industrial_iot": NetworkConditions(
                latency_ms=100.0,
                jitter_ms=25.0,
                packet_loss_rate=0.04,
                bandwidth_mbps=5.0
            ),
            "disaster_response": NetworkConditions(
                latency_ms=200.0,
                jitter_ms=80.0,
                packet_loss_rate=0.10,
                bandwidth_mbps=2.0
            )
        }
        
        return scenarios.get(name, scenarios["moderate"])
