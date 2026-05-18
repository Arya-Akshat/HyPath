"""Main simulation engine coordinating all components."""

import asyncio
import uuid
import time
import logging
from typing import Optional, List
from backend.core.models import (
    Packet, Protocol, PacketPriority, PacketType, NetworkConditions
)
from backend.transport.tcp_transport import TCPServer, TCPClient
from backend.transport.udp_transport import UDPServer, UDPClient
from backend.transport.retransmission import RetransmissionManager, ReassemblyEngine
from backend.emulator.network_emulator import NetworkEmulator
from backend.scheduler.adaptive_scheduler import AdaptiveScheduler
from backend.analytics.metrics_collector import MetricsCollector

logger = logging.getLogger(__name__)


class SimulationEngine:
    """Main simulation engine coordinating all components."""
    
    def __init__(self):
        """Initialize simulation engine."""
        self.session_id = str(uuid.uuid4())
        self.running = False
        
        # Transport layer
        self.tcp_server = TCPServer(host='127.0.0.1', port=8888)
        self.tcp_client = TCPClient(host='127.0.0.1', port=8888)
        self.udp_server = UDPServer(host='127.0.0.1', port=9999)
        self.udp_client = UDPClient(host='127.0.0.1', port=9999)
        
        # Network emulator
        self.emulator = NetworkEmulator()
        
        # Scheduler
        self.scheduler = AdaptiveScheduler(mode=Protocol.HYBRID)
        
        # Retransmission and reassembly
        self.retransmission_mgr = RetransmissionManager()
        self.reassembly_engine = ReassemblyEngine()
        
        # Analytics
        self.metrics_collector = MetricsCollector()
        
        # Packet queue
        self.send_queue: asyncio.Queue = asyncio.Queue()
        
        # Event callbacks
        self.event_callbacks = []
        
        # Setup handlers
        self.tcp_server.set_packet_handler(self._handle_received_packet)
        self.udp_server.set_packet_handler(self._handle_received_packet)
        self.retransmission_mgr.set_retransmit_callback(self._retransmit_packet)
    
    def add_event_callback(self, callback):
        """Add callback for simulation events."""
        self.event_callbacks.append(callback)
    
    async def _emit_event(self, event_type: str, data: dict):
        """Emit event to all callbacks."""
        event = {
            "type": event_type,
            "timestamp": time.time(),
            "data": data
        }
        
        for callback in self.event_callbacks:
            try:
                await callback(event)
            except Exception as e:
                logger.error(f"Event callback error: {e}")
    
    async def start(self):
        """Start simulation engine."""
        logger.info("Starting simulation engine...")
        self.running = True
        
        # Reset simulation state to ensure clean metrics and protocol counters
        self.reset_simulation_state()
        
        # Start transport servers
        await self.tcp_server.start()
        await self.udp_server.start()
        
        # Connect clients
        await self.tcp_client.connect()
        await self.udp_client.connect()
        
        # Start metrics session
        self.metrics_collector.start_session(self.session_id, self.scheduler.mode)
        
        # Start packet processor
        asyncio.create_task(self._process_send_queue())
        
        await self._emit_event("simulation_started", {"session_id": self.session_id})
        logger.info("Simulation engine started")
    
    async def stop(self):
        """Stop simulation engine."""
        logger.info("Stopping simulation engine...")
        self.running = False
        
        # Stop transport
        await self.tcp_server.stop()
        await self.udp_server.stop()
        await self.tcp_client.disconnect()
        await self.udp_client.disconnect()
        
        # End metrics session
        self.metrics_collector.end_session(self.session_id)
        
        await self._emit_event("simulation_stopped", {"session_id": self.session_id})
        logger.info("Simulation engine stopped")
    
    async def send_data(self, payload: bytes, priority: PacketPriority, sequence: int):
        """Send data packet."""
        packet = Packet(
            packet_id=str(uuid.uuid4()),
            sequence_number=sequence,
            timestamp=time.time(),
            protocol_used=Protocol.TCP,  # Will be determined by scheduler
            priority=priority,
            payload=payload,
            session_id=self.session_id,
            source="sender",
            destination="receiver"
        )
        
        await self.send_queue.put(packet)
    
    async def _process_send_queue(self):
        """Process packets from send queue."""
        while self.running:
            try:
                packet = await asyncio.wait_for(self.send_queue.get(), timeout=0.1)
                await self._send_packet(packet)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Send queue error: {e}")
    
    async def _send_packet(self, packet: Packet):
        """Send packet through appropriate protocol."""
        # Select protocol using scheduler
        selected_protocol = self.scheduler.select_protocol(packet)
        packet.protocol_used = selected_protocol
        
        # Record metrics
        self.metrics_collector.record_packet_sent(
            self.session_id,
            selected_protocol,
            len(packet.payload)
        )
        
        # Emit event
        await self._emit_event("packet_sent", {
            "packet_id": packet.packet_id,
            "protocol": selected_protocol.value,
            "priority": packet.priority.name,
            "size": len(packet.payload),
            "sequence": packet.sequence_number
        })
        
        # Apply network emulation
        emulated_packet = await self.emulator.process_packet(packet)
        
        if emulated_packet is None:
            # Packet dropped by emulator
            self.metrics_collector.record_packet_lost(self.session_id)
            await self._emit_event("packet_dropped", {
                "packet_id": packet.packet_id,
                "reason": "network_emulation"
            })
            return
        
        # Send through selected protocol
        success = False
        if selected_protocol == Protocol.TCP:
            success = await self.tcp_client.send_packet(emulated_packet)
        else:
            success = await self.udp_client.send_packet(emulated_packet)
        
        if success:
            # Track for retransmission
            await self.retransmission_mgr.send_packet(emulated_packet)
        else:
            self.metrics_collector.record_packet_lost(self.session_id)
    
    async def _retransmit_packet(self, packet: Packet):
        """Retransmit packet."""
        self.metrics_collector.record_retransmission(self.session_id)
        
        await self._emit_event("packet_retransmitted", {
            "packet_id": packet.packet_id,
            "retransmission_count": packet.retransmission_count
        })
        
        # Resend packet
        if packet.protocol_used == Protocol.TCP:
            await self.tcp_client.send_packet(packet)
        else:
            await self.udp_client.send_packet(packet)
    
    async def _handle_received_packet(self, packet: Packet):
        """Handle received packet."""
        # Calculate latency
        latency = time.time() - packet.timestamp
        
        # Handle ACK/NACK
        if packet.packet_type == PacketType.ACK:
            self.retransmission_mgr.handle_ack(packet.packet_id)
            return
        elif packet.packet_type == PacketType.NACK:
            self.retransmission_mgr.handle_nack(packet.packet_id)
            return
        
        # Record metrics
        self.metrics_collector.record_packet_received(
            self.session_id,
            len(packet.payload),
            latency
        )
        
        # Emit event
        await self._emit_event("packet_received", {
            "packet_id": packet.packet_id,
            "protocol": packet.protocol_used.value,
            "latency": latency,
            "size": len(packet.payload),
            "sequence": packet.sequence_number
        })
        
        # Reassemble packets
        reassembled = self.reassembly_engine.receive_packet(packet)
        
        if reassembled:
            await self._emit_event("packets_reassembled", {
                "count": len(reassembled),
                "session_id": packet.session_id
            })
        
        # Send ACK
        ack_packet = Packet(
            packet_id=packet.packet_id,
            sequence_number=packet.sequence_number,
            timestamp=time.time(),
            protocol_used=packet.protocol_used,
            priority=PacketPriority.CRITICAL,
            payload=b"ACK",
            packet_type=PacketType.ACK,
            session_id=packet.session_id
        )
        
        if packet.protocol_used == Protocol.TCP:
            await self.tcp_client.send_packet(ack_packet)
        else:
            await self.udp_client.send_packet(ack_packet)
    
    def reset_simulation_state(self):
        """Reset all simulation statistics and session state."""
        self.session_id = str(uuid.uuid4())
        
        # Reset scheduler stats
        self.scheduler.reset_stats()
        
        # Reset emulator stats
        self.emulator.reset_stats()
        
        # Reset retransmission manager stats and tracking
        self.retransmission_mgr.stats = {
            "packets_sent": 0,
            "acks_received": 0,
            "nacks_received": 0,
            "retransmissions": 0,
            "timeouts": 0,
            "max_retries_exceeded": 0
        }
        self.retransmission_mgr.pending_acks.clear()
        for timer in list(self.retransmission_mgr.timers.values()):
            timer.cancel()
        self.retransmission_mgr.timers.clear()
        
        # Reset reassembly engine stats and tracking
        self.reassembly_engine.stats = {
            "packets_received": 0,
            "packets_reordered": 0,
            "packets_reassembled": 0,
            "checksum_failures": 0
        }
        self.reassembly_engine.received_packets.clear()
        self.reassembly_engine.expected_sequence.clear()
        self.reassembly_engine.missing_packets.clear()

    def set_mode(self, mode: Protocol):
        """Change simulation mode."""
        self.scheduler.set_mode(mode)
        if self.running:
            self.reset_simulation_state()
            self.metrics_collector.start_session(self.session_id, mode)
    
    def update_network_conditions(self, conditions: NetworkConditions):
        """Update network emulation conditions."""
        self.emulator.update_conditions(conditions)
    
    def get_metrics(self) -> dict:
        """Get current metrics."""
        return {
            "session": self.metrics_collector.get_session_metrics(self.session_id),
            "scheduler": self.scheduler.get_stats(),
            "retransmission": self.retransmission_mgr.get_stats(),
            "reassembly": self.reassembly_engine.get_stats(),
            "emulator": self.emulator.get_stats()
        }
