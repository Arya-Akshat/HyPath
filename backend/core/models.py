"""Core data models for the hybrid transport protocol simulator."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any
import time
import hashlib
import json


class Protocol(Enum):
    """Transport protocol types."""
    TCP = "TCP"
    UDP = "UDP"
    HYBRID = "HYBRID"


class PacketPriority(Enum):
    """Packet priority levels."""
    CRITICAL = 4
    REALTIME = 3
    BULK = 2
    OPTIONAL = 1


class PacketType(Enum):
    """Packet types."""
    DATA = "DATA"
    ACK = "ACK"
    NACK = "NACK"
    HEARTBEAT = "HEARTBEAT"


@dataclass
class Packet:
    """Unified packet abstraction for TCP/UDP hybrid transport."""
    
    packet_id: str
    sequence_number: int
    timestamp: float
    protocol_used: Protocol
    priority: PacketPriority
    payload: bytes
    packet_type: PacketType = PacketType.DATA
    checksum: str = ""
    retransmission_count: int = 0
    path_id: int = 0
    session_id: str = ""
    source: str = ""
    destination: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Calculate checksum after initialization."""
        if not self.checksum:
            self.checksum = self.calculate_checksum()
    
    def calculate_checksum(self) -> str:
        """Calculate SHA256 checksum of payload."""
        return hashlib.sha256(self.payload).hexdigest()
    
    def verify_checksum(self) -> bool:
        """Verify packet integrity."""
        return self.checksum == self.calculate_checksum()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert packet to dictionary for serialization."""
        return {
            "packet_id": self.packet_id,
            "sequence_number": self.sequence_number,
            "timestamp": self.timestamp,
            "protocol_used": self.protocol_used.value,
            "priority": self.priority.value,
            "payload": self.payload.hex(),
            "packet_type": self.packet_type.value,
            "checksum": self.checksum,
            "retransmission_count": self.retransmission_count,
            "path_id": self.path_id,
            "session_id": self.session_id,
            "source": self.source,
            "destination": self.destination,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Packet':
        """Create packet from dictionary."""
        return cls(
            packet_id=data["packet_id"],
            sequence_number=data["sequence_number"],
            timestamp=data["timestamp"],
            protocol_used=Protocol(data["protocol_used"]),
            priority=PacketPriority(data["priority"]),
            payload=bytes.fromhex(data["payload"]),
            packet_type=PacketType(data["packet_type"]),
            checksum=data["checksum"],
            retransmission_count=data["retransmission_count"],
            path_id=data["path_id"],
            session_id=data["session_id"],
            source=data["source"],
            destination=data["destination"],
            metadata=data.get("metadata", {})
        )
    
    def serialize(self) -> bytes:
        """Serialize packet to bytes."""
        return json.dumps(self.to_dict()).encode('utf-8')
    
    @classmethod
    def deserialize(cls, data: bytes) -> 'Packet':
        """Deserialize packet from bytes."""
        return cls.from_dict(json.loads(data.decode('utf-8')))


@dataclass
class PathMetrics:
    """Metrics for a network path."""
    
    path_id: int
    protocol: Protocol
    rtt: float = 0.0
    loss_rate: float = 0.0
    jitter: float = 0.0
    throughput: float = 0.0
    congestion_level: float = 0.0
    retransmissions: int = 0
    queue_size: int = 0
    packets_sent: int = 0
    packets_received: int = 0
    packets_lost: int = 0
    last_updated: float = field(default_factory=time.time)
    
    def calculate_score(self) -> float:
        """Calculate path quality score (0-100)."""
        # Weighted scoring algorithm
        rtt_score = max(0, 100 - (self.rtt * 10))  # Lower RTT is better
        loss_score = max(0, 100 - (self.loss_rate * 100))  # Lower loss is better
        jitter_score = max(0, 100 - (self.jitter * 20))  # Lower jitter is better
        throughput_score = min(100, self.throughput / 10)  # Higher throughput is better
        congestion_score = max(0, 100 - (self.congestion_level * 100))  # Lower congestion is better
        
        # Weighted average
        score = (
            rtt_score * 0.3 +
            loss_score * 0.3 +
            jitter_score * 0.15 +
            throughput_score * 0.15 +
            congestion_score * 0.1
        )
        
        return max(0, min(100, score))
    
    def update_rtt(self, new_rtt: float):
        """Update RTT with exponential moving average."""
        alpha = 0.125  # Smoothing factor
        self.rtt = alpha * new_rtt + (1 - alpha) * self.rtt
        self.last_updated = time.time()
    
    def update_loss_rate(self):
        """Update packet loss rate."""
        if self.packets_sent > 0:
            self.loss_rate = self.packets_lost / self.packets_sent
        self.last_updated = time.time()


@dataclass
class NetworkConditions:
    """Network emulation conditions."""
    
    latency_ms: float = 0.0
    jitter_ms: float = 0.0
    packet_loss_rate: float = 0.0
    bandwidth_mbps: float = 100.0
    corruption_rate: float = 0.0
    duplication_rate: float = 0.0
    reorder_rate: float = 0.0
    congestion_level: float = 0.0


@dataclass
class SessionState:
    """Session state tracking."""
    
    session_id: str
    mode: Protocol
    start_time: float
    packets_sent: int = 0
    packets_received: int = 0
    bytes_sent: int = 0
    bytes_received: int = 0
    retransmissions: int = 0
    active: bool = True
    tcp_path_metrics: Optional[PathMetrics] = None
    udp_path_metrics: Optional[PathMetrics] = None
