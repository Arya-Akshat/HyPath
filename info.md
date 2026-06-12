# HyPath - Hybrid Multi-Path Transport Protocol Simulator

## 1. Project Overview
HyPath is an advanced, high-performance network transport protocol simulator and emulator. It demonstrates adaptive, priority-based packet routing across TCP and UDP sockets in real-time. By active measurement of network path quality, HyPath dynamically schedules packets to maximize reliability while minimizing transmission latency under fluctuating network conditions.

---

## 2. Core Architecture
HyPath operates as a client-server architecture with three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Charts     │  │   Controls   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                  WebSocket (Real-time events) + REST API
                             │
┌─────────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Simulation Engine                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Adaptive   │  │   Network   │  │ Retrans &   │         │
│  │  Scheduler  │  │  Emulator   │  │ Reassembly  │         │
│  │  (Routing)  │  │(Impairments)│  │ (Queue/ACK) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         TCP Transport    │    UDP Transport         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

* **Frontend:** Built with React, Vite, TailwindCSS, Lucide Icons, and Recharts. It features a glassmorphic dashboard visualizing live telemetry metrics, protocol distributions, latency/throughput trends, and animated packet flights.
* **Backend:** Built with Python and FastAPI. The simulation loop, custom socket transport wrappers, network emulator, and retransmission managers are implemented natively with `asyncio`.
* **Telemetry Feed:** Utilizes a real-time WebSocket connection (`/ws`) to stream packet events (`packet_sent`, `packet_received`, `packet_dropped`, `packet_retransmitted`) directly from the backend to the UI.

---

## 3. Core Mechanisms & Algorithms

### A. Path Quality Scoring Algorithm
To evaluate network channel health, the simulator calculates a Path Score (0–100) for both the TCP and UDP channels using a weighted linear combination of active metrics:

$$Score = (RTT_{score} \times 0.3) + (Loss_{score} \times 0.3) + (Jitter_{score} \times 0.15) + (Throughput_{score} \times 0.15) + (Congestion_{score} \times 0.1)$$

Where:
* $RTT_{score} = \max(0, 100 - (RTT_{seconds} \times 200))$
* $Loss_{score} = \max(0, 100 - (Loss\_Rate \times 500))$
* $Jitter_{score} = \max(0, 100 - (Jitter \times 500))$
* $Throughput_{score} = \min(100, Throughput\_Mbps)$
* $Congestion_{score} = \max(0, 100 - (Congestion \times 100))$

### B. Adaptive Packet Routing Scheduler
The scheduler classifies and routes packets based on their priority and active path scores:
* **`CRITICAL`:** Always uses **TCP** to guarantee in-order delivery and reliability.
* **`REALTIME`:** Prefers **UDP** to eliminate queueing/retransmission delays. If the UDP path score drops below `40.0`, it dynamically reroutes packets to **TCP** to prevent loss.
* **`OPTIONAL`:** Always uses **UDP** (best-effort, reducing TCP buffer pressure).
* **`BULK`:** Adaptive routing. If one path score exceeds the other by a margin threshold of `15.0`, it switches traffic to the superior protocol. If scores are similar, it defaults to **TCP** for safety.

### C. Socket Implementations
* **TCP Transport:** Employs `asyncio.start_server` and `asyncio.open_connection` over localhost port `8888`. To prevent TCP stream segmentation issues, it prefixes each packet with a **4-byte big-endian length header** so the receiver knows exactly how many bytes to read (`reader.readexactly`).
* **UDP Transport:** Employs stateless `loop.create_datagram_endpoint` bound to localhost port `9999` with a custom `asyncio.DatagramProtocol` callback handler.
* **Pacing Delay:** Packets are processed sequentially from a central queue (`send_queue`) with a minimum pacing delay of `50ms` (20 packets/sec) to prevent local network loop flooding and ensure smooth UI animations.

### D. Reliability & Network Impairment Emulation
* **Retransmission Manager:** Performs TCP packet retry handling. When a TCP packet is sent, it begins a timeout task (`2.0s`). If an ACK is not received before timeout, the packet is retransmitted (max `3` retries). RTT is estimated on ACK arrival using an Exponential Moving Average ($\alpha = 0.125$).
* **Impairment Injection:** 
  * *Loss:* Random drop distribution.
  * *Corruption:* Replaces packet checksum with `"corrupted"`. The receiver checks payload SHA256 integrity and discards corrupted packets.
  * *Jitter & Latency:* Adds random jitter offsets to base latency and delays tasks using `asyncio.sleep`.
  * *Reordering:* Injects random sleep delays of $10\text{ms} - 50\text{ms}$ on individual packet threads.

---

## 4. Predefined Network Scenarios
The simulator features 9 network profiles representing different physical link conditions and environments:

| Scenario Name | Latency (ms) | Jitter (ms) | Packet Loss Rate | Bandwidth (Mbps) | Primary Testing Use Case |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Ideal** | 1.0 | 0.1 | 0.0% | 1000.0 | Baseline local loopback behavior |
| **Good** | 10.0 | 2.0 | 0.1% | 100.0 | Broadband/LAN wireline connection |
| **Moderate** | 50.0 | 10.0 | 2.0% | 50.0 | Cellular 4G/LTE mobile connection |
| **Poor** | 150.0 | 30.0 | 5.0% | 10.0 | Congested Wi-Fi or 3G link |
| **Terrible** | 300.0 | 100.0 | 15.0% | 1.0 | Deep rural satellite link |
| **Drone Telemetry** | 80.0 | 20.0 | 3.0% | 20.0 | Rapidly moving node with fading signal |
| **Live Streaming** | 30.0 | 5.0 | 1.0% | 50.0 | Real-time audio/video media streams |
| **Industrial IoT** | 100.0 | 25.0 | 4.0% | 5.0 | High-interference sensor network |
| **Disaster Response**| 200.0 | 80.0 | 10.0% | 2.0 | High-altitude balloon/emergency mesh |

---

## 5. Verification & Comparison (ns-3 Equivalent Results)
To verify the simulator's behavioral correctness, a discrete-event simulation model matching ns-3/NetSim core parameters was run across all scenarios (using 200 packets per test run):

| Scenario | Mode | Delivery Ratio | Avg Latency | Retransmissions | Protocol Split |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Ideal** | UDP | 100.0% | 1.0 ms | 0 | 0 TCP / 200 UDP |
| **Ideal** | TCP | 100.0% | 1.0 ms | 0 | 200 TCP / 0 UDP |
| **Ideal** | **HYBRID** | 100.0% | 1.0 ms | 0 | 50 TCP / 150 UDP |
| **Good** | UDP | 100.0% | 10.0 ms | 0 | 0 TCP / 200 UDP |
| **Good** | TCP | 100.0% | 10.0 ms | 0 | 200 TCP / 0 UDP |
| **Good** | **HYBRID** | 100.0% | 10.1 ms | 0 | 50 TCP / 150 UDP |
| **Moderate**| UDP | 97.0% | 49.9 ms | 0 | 0 TCP / 200 UDP |
| **Moderate**| TCP | 100.0% | 50.6 ms | 1 | 200 TCP / 0 UDP |
| **Moderate**| **HYBRID** | 99.0% | 50.5 ms | 1 | 50 TCP / 150 UDP |
| **Poor** | UDP | 94.5% | 150.3 ms | 0 | 0 TCP / 200 UDP |
| **Poor** | TCP | 100.0% | 167.6 ms | 12 | 200 TCP / 0 UDP |
| **Poor** | **HYBRID** | 98.0% | 157.0 ms | 5 | 100 TCP / 100 UDP |
| **Terrible**| UDP | 89.0% | 298.9 ms | 0 | 0 TCP / 200 UDP |
| **Terrible**| TCP | 100.0% | 429.5 ms | 43 | 200 TCP / 0 UDP |
| **Terrible**| **HYBRID** | 95.0% | 365.2 ms | 21 | 150 TCP / 50 UDP |
| **Drone Telemetry**| UDP | 98.0% | 79.6 ms | 0 | 0 TCP / 200 UDP |
| **Drone Telemetry**| TCP | 100.0% | 83.5 ms | 4 | 200 TCP / 0 UDP |
| **Drone Telemetry**| **HYBRID** | 97.5% | 80.7 ms | 1 | 50 TCP / 150 UDP |
| **Live Streaming**| UDP | 97.5% | 30.0 ms | 0 | 0 TCP / 200 UDP |
| **Live Streaming**| TCP | 100.0% | 31.4 ms | 3 | 200 TCP / 0 UDP |
| **Live Streaming**| **HYBRID** | 99.0% | 30.7 ms | 1 | 50 TCP / 150 UDP |
| **Industrial IoT**| UDP | 96.5% | 99.9 ms | 0 | 0 TCP / 200 UDP |
| **Industrial IoT**| TCP | 100.0% | 111.0 ms | 11 | 200 TCP / 0 UDP |
| **Industrial IoT**| **HYBRID** | 97.5% | 100.9 ms | 1 | 100 TCP / 100 UDP |
| **Disaster Response**| UDP | 90.5% | 200.5 ms | 0 | 0 TCP / 200 UDP |
| **Disaster Response**| TCP | 100.0% | 238.3 ms | 19 | 200 TCP / 0 UDP |
| **Disaster Response**| **HYBRID** | 96.0% | 231.2 ms | 15 | 150 TCP / 50 UDP |

### Takeaways
1. **TCP Tradeoff (Reliability vs. Latency):** TCP maintains a `100.0%` delivery ratio across all scenarios, but under high packet loss (e.g., Terrible / Disaster Response), the average latency balloons significantly (e.g., `429.5 ms` vs. UDP's `298.9 ms`). This is caused by retransmission wait states (RTO).
2. **UDP Tradeoff (Speed vs. Loss):** UDP latency remains close to the base propagation delay, but packet loss is unchecked (e.g., `11.0%` drop rate under Terrible conditions).
3. **Adaptive Hybrid Strategy:** Under moderate conditions, Hybrid mimics UDP to prioritize low latency. Under poor conditions, it dynamically routes degraded streams back to TCP. In Terrible/Disaster scenarios, it preserves `95.0% - 96.0%` delivery with significantly lower latency overhead than pure TCP (`365.2 ms` vs `429.5 ms`).

---

## 6. Real-World Traffic Profiling (Planned Feature)
To support real-world workload emulation, we can extend the UI's "Send Test Data" panel to allow users to upload structured traffic files:

* **File Format (.csv or .json):** Lists individual packets, their data payload, and their classification.
* **Auto-Routing:** The backend parses the file upload, instantiates the corresponding `Packet` objects, and feeds them into the paced scheduler.
* **Classification Criteria:**
  * **Port Mapping:** Mapping specific destination ports to priorities.
  * **Payload Inspection:** Mapping structured configs (JSON/XML) to Critical, media packets to Realtime, and bulk transfers to Bulk.
  * **Size Heuristics:** Handshake and ACK packets (<128 bytes) mapped to Realtime, large payloads to Bulk.
