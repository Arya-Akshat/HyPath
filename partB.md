# Hybrid Multi-Path Transport Protocol Simulator

## Topic
Design and implementation of a **Hybrid Multi-Path Transport Protocol Simulator** that intelligently routes network packets between TCP and UDP paths based on real-time network conditions and packet priority, with a live web-based dashboard for monitoring and control.

---

## Objectives
1. Simulate TCP and UDP transport layers and allow dynamic switching between them during transmission.
2. Emulate real-world network impairments such as packet loss, latency, jitter, and bandwidth throttling.
3. Implement an adaptive routing engine that selects the best protocol based on packet priority and path quality.
4. Build a real-time web dashboard to visualize packet flow, latency charts, and protocol distribution.
5. Benchmark and compare the performance of TCP-only, UDP-only, and Hybrid modes under various network scenarios.

---

## Methodology
The project follows a client-server architecture. The **backend** is built with Python (FastAPI + asyncio) and handles all simulation logic — packet creation, routing decisions, network emulation, and metrics collection. The **frontend** is a React + TypeScript web application that connects to the backend via WebSockets and displays live charts and controls.

When the user starts a simulation and sends packets, each packet is assigned a priority (Critical, Realtime, Bulk, or Optional). The adaptive scheduler evaluates the current quality of both TCP and UDP paths using a scoring formula, and routes each packet to the best-suited protocol. The network emulator then applies configured impairments (loss, delay, jitter) before the packet reaches the receiver. On the receiving end, packets are reassembled in order, checksums are verified, and acknowledgements are sent back.

The frontend updates in real-time, showing latency comparisons, throughput graphs, protocol distribution pie charts, and delivery statistics. Users can switch between network scenarios (good, moderate, poor) and routing modes (TCP, UDP, Hybrid) to observe how the system adapts.

---

## Implementation Details

### System Architecture
The project follows a full-stack client-server architecture. The **frontend** (React + TypeScript) provides an interactive dashboard with real-time charts and simulation controls. It communicates with the **backend** (Python FastAPI) via REST API calls for commands and a WebSocket connection for live event streaming. The backend's asyncio-based Simulation Engine orchestrates the entire packet lifecycle by coordinating the following core modules:

| Module | Technology | Role |
|---|---|---|
| Adaptive Scheduler | Python | Scores TCP/UDP paths and selects the best protocol per packet |
| Network Emulator | Python | Injects packet loss, latency, jitter, and bandwidth limits |
| Transport Layer | asyncio sockets | TCP stream server/client and UDP datagram protocol |
| Retransmission Manager | Python | Tracks ACKs/NACKs, handles timeouts and retries |
| Metrics Collector | Python | Computes delivery ratio, latency, throughput in real time |

### Adaptive Routing Logic
In Hybrid mode, the scheduler makes a per-packet routing decision based on the packet's priority and the current health of both paths. Each path's quality score (0–100) is recalculated before every decision using five weighted metrics: round-trip time (30%), packet loss rate (30%), jitter (15%), throughput (15%), and congestion level (10%).

| Packet Priority | Routing Rule | Reason |
|---|---|---|
| CRITICAL | Always TCP | Must guarantee delivery via retransmission |
| REALTIME | UDP if path score > 40, else TCP | Prefers low latency; falls back if UDP is degraded |
| BULK | Protocol with score higher by 15+ points, else TCP | Adapts to whichever path is currently better |
| OPTIONAL | Always UDP | Best-effort delivery, no retransmission needed |

### Flowchart


---

## Testing and Output

### Test Coverage
We wrote 15 automated test cases using Python's `pytest` framework to validate the core components of the project:

| Test Area | What Was Tested | Cases |
|---|---|---|
| Packet Model | Creation, SHA-256 checksum calculation, JSON serialization/deserialization | 3 |
| Path Metrics | Score calculation accuracy, RTT smoothing (exponential moving average), loss rate updates | 3 |
| Adaptive Scheduler | TCP-only mode, UDP-only mode, Critical→TCP, Realtime→UDP, Optional→UDP, Bulk adaptive routing, statistics tracking | 7 |
| Simulation Engine | State reset on start, automatic metric reset on mode change while running | 2 |

All 15 tests passed successfully in under 0.05 seconds.

### Sample Output — Dashboard Observations
When a simulation is run with 100 packets under a **moderate network scenario** (5% loss, 50ms latency, 5ms jitter):

- **TCP Mode:** All packets delivered (100%), but average latency increased to ~165ms due to retransmission delays. 8 packets required retransmission.
- **UDP Mode:** Latency stayed low at ~52ms, but 6 packets were lost (94% delivery). No retransmissions occurred.
- **Hybrid Mode:** Critical packets were sent via TCP (100% delivery), while Realtime packets used UDP for low latency. Overall delivery reached ~100% with an average latency of ~78ms — combining the strengths of both protocols.

### Performance Comparison

| Metric | TCP Mode | UDP Mode | Hybrid Mode |
|---|---|---|---|
| Delivery Ratio | 100% | ~94% (with 5% loss) | ~100% (critical reliable, optional best-effort) |
| Average Latency | High (grows with loss) | Low (constant) | Optimized (priority-dependent) |
| Retransmissions | High under loss | None | Low (only for critical packets) |
| Best Suited For | File transfers, critical data | Live streaming, gaming | Mixed workloads, adaptive scenarios |

The Hybrid mode consistently demonstrated the best balance between reliability and latency across all tested scenarios, validating the effectiveness of the adaptive routing approach implemented in this project.
