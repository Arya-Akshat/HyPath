"""Adaptive packet scheduler with intelligent routing."""

import time
import logging
from typing import Dict, Optional
from backend.core.models import (
    Packet, Protocol, PacketPriority, PathMetrics
)

logger = logging.getLogger(__name__)


class AdaptiveScheduler:
    """
    Intelligent packet scheduler that routes packets based on:
    - Packet priority
    - Network conditions
    - Path metrics
    - Protocol characteristics
    """
    
    def __init__(self, mode: Protocol = Protocol.HYBRID):
        """Initialize adaptive scheduler."""
        self.mode = mode
        self.tcp_metrics = PathMetrics(path_id=0, protocol=Protocol.TCP)
        self.udp_metrics = PathMetrics(path_id=1, protocol=Protocol.UDP)
        
        self.routing_decisions = []
        self.stats = {
            "tcp_packets": 0,
            "udp_packets": 0,
            "switches": 0,
            "total_packets": 0
        }
        
        # Thresholds for adaptive switching
        self.min_score_threshold = 40.0
        self.score_difference_threshold = 15.0
    
    def set_mode(self, mode: Protocol):
        """Change routing mode."""
        old_mode = self.mode
        self.mode = mode
        logger.info(f"Routing mode changed: {old_mode.value} -> {mode.value}")
    
    def update_tcp_metrics(self, metrics: PathMetrics):
        """Update TCP path metrics."""
        self.tcp_metrics = metrics
    
    def update_udp_metrics(self, metrics: PathMetrics):
        """Update UDP path metrics."""
        self.udp_metrics = metrics
    
    def select_protocol(self, packet: Packet) -> Protocol:
        """
        Select best protocol for packet based on priority and path metrics.
        
        Routing logic:
        - CRITICAL packets: Prefer TCP (reliability)
        - REALTIME packets: Prefer UDP (low latency)
        - BULK packets: Adaptive based on path scores
        - OPTIONAL packets: UDP fallback
        """
        self.stats["total_packets"] += 1
        
        # Force mode if not hybrid
        if self.mode == Protocol.TCP:
            self.stats["tcp_packets"] += 1
            return Protocol.TCP
        elif self.mode == Protocol.UDP:
            self.stats["udp_packets"] += 1
            return Protocol.UDP
        
        # Hybrid mode - intelligent routing
        tcp_score = self.tcp_metrics.calculate_score()
        udp_score = self.udp_metrics.calculate_score()
        
        selected_protocol = None
        reason = ""
        
        # Priority-based routing
        if packet.priority == PacketPriority.CRITICAL:
            # Critical packets always use TCP for reliability
            selected_protocol = Protocol.TCP
            reason = "CRITICAL priority requires reliability"
            
        elif packet.priority == PacketPriority.REALTIME:
            # Realtime packets prefer UDP for low latency
            # But switch to TCP if UDP is severely degraded
            if udp_score > self.min_score_threshold:
                selected_protocol = Protocol.UDP
                reason = "REALTIME priority prefers low latency"
            else:
                selected_protocol = Protocol.TCP
                reason = "UDP degraded, fallback to TCP"
                
        elif packet.priority == PacketPriority.OPTIONAL:
            # Optional packets use UDP to save TCP resources
            selected_protocol = Protocol.UDP
            reason = "OPTIONAL priority uses UDP"
            
        else:  # BULK packets
            # Adaptive routing based on path scores
            if tcp_score > udp_score + self.score_difference_threshold:
                selected_protocol = Protocol.TCP
                reason = f"TCP score superior ({tcp_score:.1f} vs {udp_score:.1f})"
            elif udp_score > tcp_score + self.score_difference_threshold:
                selected_protocol = Protocol.UDP
                reason = f"UDP score superior ({udp_score:.1f} vs {tcp_score:.1f})"
            else:
                # Scores similar, use TCP for reliability
                selected_protocol = Protocol.TCP
                reason = f"Scores similar, prefer TCP reliability"
        
        # Track statistics
        if selected_protocol == Protocol.TCP:
            self.stats["tcp_packets"] += 1
        else:
            self.stats["udp_packets"] += 1
        
        # Log routing decision
        decision = {
            "timestamp": time.time(),
            "packet_id": packet.packet_id,
            "priority": packet.priority.name,
            "selected_protocol": selected_protocol.value,
            "tcp_score": tcp_score,
            "udp_score": udp_score,
            "reason": reason
        }
        self.routing_decisions.append(decision)
        
        logger.info(f"[DEBUG ROUTING] packet={packet.packet_id}, priority={packet.priority.name}, protocol={selected_protocol.value}, reason={reason}")
        
        return selected_protocol
    
    def get_path_metrics(self, protocol: Protocol) -> PathMetrics:
        """Get metrics for specified protocol."""
        if protocol == Protocol.TCP:
            return self.tcp_metrics
        else:
            return self.udp_metrics
    
    def get_stats(self) -> Dict:
        """Get scheduler statistics."""
        total = self.stats["total_packets"]
        return {
            **self.stats,
            "tcp_percentage": (self.stats["tcp_packets"] / total * 100) if total > 0 else 0,
            "udp_percentage": (self.stats["udp_packets"] / total * 100) if total > 0 else 0,
            "tcp_score": self.tcp_metrics.calculate_score(),
            "udp_score": self.udp_metrics.calculate_score()
        }
    
    def get_recent_decisions(self, count: int = 10) -> list:
        """Get recent routing decisions."""
        return self.routing_decisions[-count:]
    
    def reset_stats(self):
        """Reset statistics."""
        self.stats = {
            "tcp_packets": 0,
            "udp_packets": 0,
            "switches": 0,
            "total_packets": 0
        }
        self.routing_decisions.clear()
