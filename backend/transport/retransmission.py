"""Retransmission and reliability layer."""

import asyncio
import time
import logging
from typing import Dict, Set, Optional, Callable
from backend.core.models import Packet, PacketType

logger = logging.getLogger(__name__)


class RetransmissionManager:
    """Manages packet retransmissions and ACK/NACK handling."""
    
    def __init__(self, timeout: float = 2.0, max_retries: int = 3):
        """Initialize retransmission manager."""
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Track sent packets awaiting ACK
        self.pending_acks: Dict[str, Dict] = {}
        
        # Track retransmission timers
        self.timers: Dict[str, asyncio.Task] = {}
        
        # Callback for retransmission
        self.retransmit_callback: Optional[Callable] = None
        
        # Statistics
        self.stats = {
            "packets_sent": 0,
            "acks_received": 0,
            "nacks_received": 0,
            "retransmissions": 0,
            "timeouts": 0,
            "max_retries_exceeded": 0
        }
    
    def set_retransmit_callback(self, callback: Callable):
        """Set callback for retransmitting packets."""
        self.retransmit_callback = callback
    
    async def send_packet(self, packet: Packet):
        """Register packet for ACK tracking."""
        self.stats["packets_sent"] += 1
        
        # Store packet info
        self.pending_acks[packet.packet_id] = {
            "packet": packet,
            "sent_time": time.time(),
            "retries": 0
        }
        
        # Start timeout timer
        timer = asyncio.create_task(self._timeout_handler(packet.packet_id))
        self.timers[packet.packet_id] = timer
    
    async def _timeout_handler(self, packet_id: str):
        """Handle retransmission timeout."""
        await asyncio.sleep(self.timeout)
        
        if packet_id not in self.pending_acks:
            return
        
        packet_info = self.pending_acks[packet_id]
        packet = packet_info["packet"]
        retries = packet_info["retries"]
        
        if retries < self.max_retries:
            # Retransmit
            self.stats["retransmissions"] += 1
            self.stats["timeouts"] += 1
            packet.retransmission_count += 1
            packet_info["retries"] += 1
            packet_info["sent_time"] = time.time()
            
            logger.warning(f"Retransmitting packet {packet_id} (attempt {retries + 1})")
            
            if self.retransmit_callback:
                await self.retransmit_callback(packet)
            
            # Restart timer
            timer = asyncio.create_task(self._timeout_handler(packet_id))
            self.timers[packet_id] = timer
        else:
            # Max retries exceeded
            self.stats["max_retries_exceeded"] += 1
            logger.error(f"Max retries exceeded for packet {packet_id}")
            self._cleanup_packet(packet_id)
    
    def handle_ack(self, packet_id: str) -> bool:
        """Handle ACK for packet."""
        if packet_id in self.pending_acks:
            self.stats["acks_received"] += 1
            
            # Calculate RTT
            packet_info = self.pending_acks[packet_id]
            rtt = time.time() - packet_info["sent_time"]
            
            logger.debug(f"ACK received for packet {packet_id}, RTT={rtt:.3f}s")
            
            self._cleanup_packet(packet_id)
            return True
        return False
    
    def handle_nack(self, packet_id: str):
        """Handle NACK for packet - immediate retransmission."""
        if packet_id in self.pending_acks:
            self.stats["nacks_received"] += 1
            
            packet_info = self.pending_acks[packet_id]
            packet = packet_info["packet"]
            
            logger.warning(f"NACK received for packet {packet_id}, retransmitting immediately")
            
            # Cancel existing timer
            if packet_id in self.timers:
                self.timers[packet_id].cancel()
            
            # Retransmit immediately
            packet.retransmission_count += 1
            packet_info["retries"] += 1
            self.stats["retransmissions"] += 1
            
            if self.retransmit_callback:
                asyncio.create_task(self.retransmit_callback(packet))
            
            # Restart timer
            timer = asyncio.create_task(self._timeout_handler(packet_id))
            self.timers[packet_id] = timer
    
    def _cleanup_packet(self, packet_id: str):
        """Clean up packet tracking."""
        if packet_id in self.pending_acks:
            del self.pending_acks[packet_id]
        
        if packet_id in self.timers:
            self.timers[packet_id].cancel()
            del self.timers[packet_id]
    
    def get_stats(self) -> Dict:
        """Get retransmission statistics."""
        return self.stats.copy()
    
    def get_pending_count(self) -> int:
        """Get number of packets awaiting ACK."""
        return len(self.pending_acks)


class ReassemblyEngine:
    """Reassembles packets in correct order."""
    
    def __init__(self):
        """Initialize reassembly engine."""
        self.received_packets: Dict[str, Dict[int, Packet]] = {}  # session_id -> {seq: packet}
        self.expected_sequence: Dict[str, int] = {}  # session_id -> next expected seq
        self.missing_packets: Dict[str, Set[int]] = {}  # session_id -> set of missing seqs
        
        self.stats = {
            "packets_received": 0,
            "packets_reordered": 0,
            "packets_reassembled": 0,
            "checksum_failures": 0
        }
    
    def receive_packet(self, packet: Packet) -> Optional[list]:
        """
        Receive packet and attempt reassembly.
        Returns list of packets if sequence is complete, None otherwise.
        """
        self.stats["packets_received"] += 1
        
        # Verify checksum
        if not packet.verify_checksum():
            self.stats["checksum_failures"] += 1
            logger.error(f"Checksum failed for packet {packet.packet_id}")
            return None
        
        session_id = packet.session_id
        seq = packet.sequence_number
        
        # Initialize session tracking
        if session_id not in self.received_packets:
            self.received_packets[session_id] = {}
            self.expected_sequence[session_id] = 0
            self.missing_packets[session_id] = set()
        
        # Store packet
        self.received_packets[session_id][seq] = packet
        
        # Check if packet was out of order
        if seq < self.expected_sequence[session_id]:
            self.stats["packets_reordered"] += 1
            logger.debug(f"Received out-of-order packet: seq={seq}, expected={self.expected_sequence[session_id]}")
        
        # Try to reassemble consecutive packets
        reassembled = []
        expected = self.expected_sequence[session_id]
        
        while expected in self.received_packets[session_id]:
            packet = self.received_packets[session_id][expected]
            reassembled.append(packet)
            del self.received_packets[session_id][expected]
            expected += 1
        
        self.expected_sequence[session_id] = expected
        
        if reassembled:
            self.stats["packets_reassembled"] += len(reassembled)
            logger.debug(f"Reassembled {len(reassembled)} packets for session {session_id}")
            return reassembled
        
        return None
    
    def get_missing_packets(self, session_id: str) -> Set[int]:
        """Get set of missing packet sequence numbers."""
        if session_id not in self.received_packets:
            return set()
        
        expected = self.expected_sequence[session_id]
        received = set(self.received_packets[session_id].keys())
        
        # Find gaps in sequence
        if received:
            max_seq = max(received)
            all_seqs = set(range(expected, max_seq + 1))
            missing = all_seqs - received
            return missing
        
        return set()
    
    def get_stats(self) -> Dict:
        """Get reassembly statistics."""
        return self.stats.copy()
