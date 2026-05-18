"""Metrics collection and analytics engine."""

import time
import statistics
from typing import Dict, List
from dataclasses import dataclass, field
from backend.core.models import Protocol


@dataclass
class SessionMetrics:
    """Comprehensive session metrics."""
    
    session_id: str
    mode: Protocol
    start_time: float
    end_time: float = 0.0
    
    # Packet statistics
    packets_sent: int = 0
    packets_received: int = 0
    packets_lost: int = 0
    packets_retransmitted: int = 0
    
    # Byte statistics
    bytes_sent: int = 0
    bytes_received: int = 0
    
    # Latency statistics
    latencies: List[float] = field(default_factory=list)
    
    # Protocol usage
    tcp_packets: int = 0
    udp_packets: int = 0
    
    # Path metrics
    tcp_rtt: List[float] = field(default_factory=list)
    udp_rtt: List[float] = field(default_factory=list)
    
    def calculate_delivery_ratio(self) -> float:
        """Calculate packet delivery ratio."""
        if self.packets_sent == 0:
            return 0.0
        return (self.packets_received / self.packets_sent) * 100
    
    def calculate_loss_rate(self) -> float:
        """Calculate packet loss rate."""
        if self.packets_sent == 0:
            return 0.0
        return (self.packets_lost / self.packets_sent) * 100
    
    def calculate_avg_latency(self) -> float:
        """Calculate average latency."""
        if not self.latencies:
            return 0.0
        return statistics.mean(self.latencies)
    
    def calculate_jitter(self) -> float:
        """Calculate jitter (latency variance)."""
        if len(self.latencies) < 2:
            return 0.0
        return statistics.stdev(self.latencies)
    
    def calculate_throughput(self) -> float:
        """Calculate throughput in Mbps."""
        duration = self.end_time - self.start_time
        if duration == 0:
            return 0.0
        bits = self.bytes_received * 8
        return (bits / duration) / 1_000_000
    
    def calculate_efficiency_score(self) -> float:
        """Calculate overall efficiency score (0-100)."""
        delivery_ratio = self.calculate_delivery_ratio()
        avg_latency = self.calculate_avg_latency()
        throughput = self.calculate_throughput()
        
        # Weighted scoring
        delivery_score = delivery_ratio  # 0-100
        latency_score = max(0, 100 - (avg_latency * 10))  # Lower is better
        throughput_score = min(100, throughput * 10)  # Higher is better
        
        efficiency = (
            delivery_score * 0.4 +
            latency_score * 0.3 +
            throughput_score * 0.3
        )
        
        return max(0, min(100, efficiency))
    
    def to_dict(self) -> Dict:
        """Convert metrics to dictionary."""
        return {
            "session_id": self.session_id,
            "mode": self.mode.value,
            "duration": self.end_time - self.start_time,
            "packets_sent": self.packets_sent,
            "packets_received": self.packets_received,
            "packets_lost": self.packets_lost,
            "packets_retransmitted": self.packets_retransmitted,
            "bytes_sent": self.bytes_sent,
            "bytes_received": self.bytes_received,
            "tcp_packets": self.tcp_packets,
            "udp_packets": self.udp_packets,
            "delivery_ratio": self.calculate_delivery_ratio(),
            "loss_rate": self.calculate_loss_rate(),
            "avg_latency": self.calculate_avg_latency(),
            "jitter": self.calculate_jitter(),
            "throughput_mbps": self.calculate_throughput(),
            "efficiency_score": self.calculate_efficiency_score(),
            "tcp_utilization": (self.tcp_packets / self.packets_sent * 100) if self.packets_sent > 0 else 0,
            "udp_utilization": (self.udp_packets / self.packets_sent * 100) if self.packets_sent > 0 else 0
        }


class MetricsCollector:
    """Collects and aggregates metrics during simulation."""
    
    def __init__(self):
        """Initialize metrics collector."""
        self.sessions: Dict[str, SessionMetrics] = {}
        self.current_session: str = ""
    
    def start_session(self, session_id: str, mode: Protocol):
        """Start new metrics session."""
        self.current_session = session_id
        self.sessions[session_id] = SessionMetrics(
            session_id=session_id,
            mode=mode,
            start_time=time.time()
        )
    
    def end_session(self, session_id: str):
        """End metrics session."""
        if session_id in self.sessions:
            self.sessions[session_id].end_time = time.time()
    
    def record_packet_sent(self, session_id: str, protocol: Protocol, size: int):
        """Record sent packet."""
        if session_id in self.sessions:
            metrics = self.sessions[session_id]
            metrics.packets_sent += 1
            metrics.bytes_sent += size
            
            if protocol == Protocol.TCP:
                metrics.tcp_packets += 1
            else:
                metrics.udp_packets += 1
    
    def record_packet_received(self, session_id: str, size: int, latency: float):
        """Record received packet."""
        if session_id in self.sessions:
            metrics = self.sessions[session_id]
            metrics.packets_received += 1
            metrics.bytes_received += size
            metrics.latencies.append(latency)
    
    def record_packet_lost(self, session_id: str):
        """Record lost packet."""
        if session_id in self.sessions:
            self.sessions[session_id].packets_lost += 1
    
    def record_retransmission(self, session_id: str):
        """Record packet retransmission."""
        if session_id in self.sessions:
            self.sessions[session_id].packets_retransmitted += 1
    
    def record_rtt(self, session_id: str, protocol: Protocol, rtt: float):
        """Record RTT measurement."""
        if session_id in self.sessions:
            metrics = self.sessions[session_id]
            if protocol == Protocol.TCP:
                metrics.tcp_rtt.append(rtt)
            else:
                metrics.udp_rtt.append(rtt)
    
    def get_session_metrics(self, session_id: str) -> Dict:
        """Get metrics for specific session."""
        if session_id in self.sessions:
            return self.sessions[session_id].to_dict()
        return {}
    
    def get_all_metrics(self) -> List[Dict]:
        """Get all session metrics."""
        return [metrics.to_dict() for metrics in self.sessions.values()]
    
    def compare_modes(self) -> Dict:
        """Compare performance across different modes."""
        tcp_sessions = [m for m in self.sessions.values() if m.mode == Protocol.TCP]
        udp_sessions = [m for m in self.sessions.values() if m.mode == Protocol.UDP]
        hybrid_sessions = [m for m in self.sessions.values() if m.mode == Protocol.HYBRID]
        
        def avg_metric(sessions, metric_func):
            if not sessions:
                return 0.0
            return statistics.mean([metric_func(s) for s in sessions])
        
        return {
            "tcp_only": {
                "avg_delivery_ratio": avg_metric(tcp_sessions, lambda s: s.calculate_delivery_ratio()),
                "avg_latency": avg_metric(tcp_sessions, lambda s: s.calculate_avg_latency()),
                "avg_throughput": avg_metric(tcp_sessions, lambda s: s.calculate_throughput()),
                "avg_efficiency": avg_metric(tcp_sessions, lambda s: s.calculate_efficiency_score())
            },
            "udp_only": {
                "avg_delivery_ratio": avg_metric(udp_sessions, lambda s: s.calculate_delivery_ratio()),
                "avg_latency": avg_metric(udp_sessions, lambda s: s.calculate_avg_latency()),
                "avg_throughput": avg_metric(udp_sessions, lambda s: s.calculate_throughput()),
                "avg_efficiency": avg_metric(udp_sessions, lambda s: s.calculate_efficiency_score())
            },
            "hybrid": {
                "avg_delivery_ratio": avg_metric(hybrid_sessions, lambda s: s.calculate_delivery_ratio()),
                "avg_latency": avg_metric(hybrid_sessions, lambda s: s.calculate_avg_latency()),
                "avg_throughput": avg_metric(hybrid_sessions, lambda s: s.calculate_throughput()),
                "avg_efficiency": avg_metric(hybrid_sessions, lambda s: s.calculate_efficiency_score())
            }
        }
