export interface SimulationEvent {
  type: string;
  timestamp: number;
  data: any;
}

export interface PacketEvent {
  packet_id: string;
  protocol: 'TCP' | 'UDP';
  priority: string;
  size: number;
  sequence: number;
  latency?: number;
}

export interface Metrics {
  session: SessionMetrics;
  scheduler: SchedulerMetrics;
  retransmission: RetransmissionMetrics;
  reassembly: ReassemblyMetrics;
  emulator: EmulatorMetrics;
}

export interface SessionMetrics {
  session_id: string;
  mode: string;
  duration: number;
  packets_sent: number;
  packets_received: number;
  packets_lost: number;
  packets_retransmitted: number;
  bytes_sent: number;
  bytes_received: number;
  tcp_packets: number;
  udp_packets: number;
  delivery_ratio: number;
  loss_rate: number;
  avg_latency: number;
  jitter: number;
  throughput_mbps: number;
  efficiency_score: number;
  tcp_utilization: number;
  udp_utilization: number;
}

export interface SchedulerMetrics {
  tcp_packets: number;
  udp_packets: number;
  switches: number;
  total_packets: number;
  tcp_percentage: number;
  udp_percentage: number;
  tcp_score: number;
  udp_score: number;
}

export interface RetransmissionMetrics {
  packets_sent: number;
  acks_received: number;
  nacks_received: number;
  retransmissions: number;
  timeouts: number;
  max_retries_exceeded: number;
}

export interface ReassemblyMetrics {
  packets_received: number;
  packets_reordered: number;
  packets_reassembled: number;
  checksum_failures: number;
}

export interface EmulatorMetrics {
  packets_processed: number;
  packets_dropped: number;
  packets_delayed: number;
  packets_corrupted: number;
  packets_duplicated: number;
  packets_reordered: number;
}

export interface NetworkConditions {
  latency_ms: number;
  jitter_ms: number;
  packet_loss_rate: number;
  bandwidth_mbps: number;
  corruption_rate: number;
  duplication_rate: number;
  reorder_rate: number;
  congestion_level: number;
}

export interface SimulationStatus {
  running: boolean;
  session_id: string;
  mode: string;
}
