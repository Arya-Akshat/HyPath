# HyPath - Hybrid Multi-Path Transport Protocol Simulator

A production-grade, high-performance simulation framework demonstrating adaptive, intelligent multipath routing between TCP and UDP protocols based on real-time network impairments. Featuring a modern glassmorphic dashboard, real-time WebSocket feeds, and fully isolated, non-cumulative metric sessions for precise protocol comparison.

## 🎯 Project Overview

This simulator implements a hybrid transport protocol that dynamically routes packets between TCP and UDP based on:
- Packet priority (Critical, Realtime, Bulk, Optional)
- Network conditions (latency, loss, jitter, congestion)
- Path quality metrics (RTT, throughput, reliability)

### Key Features

✅ **Dual Protocol Transport**
- Full TCP and UDP socket implementations
- Unified packet abstraction layer
- Session management and lifecycle control

✅ **Adaptive Routing Engine**
- Real-time path quality scoring
- Priority-based protocol selection
- Dynamic switching based on network conditions

✅ **Network Emulation**
- Configurable packet loss, latency, jitter
- Bandwidth throttling
- Packet corruption, duplication, reordering
- Predefined scenarios (drone, streaming, IoT, etc.)

✅ **Reliability Layer**
- ACK/NACK handling
- Timeout-based retransmission
- Selective retransmission
- Packet reassembly and reordering

✅ **Real-time Dashboard**
- Live packet flow visualization
- Protocol utilization charts
- Latency and throughput graphs
- Path health indicators
- WebSocket-based updates

✅ **Analytics & Benchmarking**
- Comprehensive metrics collection
- Mode comparison (TCP vs UDP vs Hybrid)
- Automated benchmark suite
- JSON/CSV report generation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Charts     │  │   Controls   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                      WebSocket + REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Python)                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Simulation Engine                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Adaptive   │  │   Network   │  │ Retrans &   │         │
│  │  Scheduler  │  │  Emulator   │  │ Reassembly  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                            │                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         TCP Transport    │    UDP Transport         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Arya-Akshat/HyPath.git
cd HyPath
```

2. **Install backend dependencies**
```bash
pip install -r requirements.txt
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

### Running the Application

#### Option 1: Manual Start

**Terminal 1 - Backend:**
```bash
python backend/main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the dashboard at: `http://localhost:3000`

#### Option 2: Docker Compose

```bash
docker-compose up
```

Access the dashboard at: `http://localhost:3000`

## 📊 Usage Guide

### Starting a Simulation

1. Open the dashboard at `http://localhost:3000`
2. Select a mode:
   - **TCP**: All packets use TCP
   - **UDP**: All packets use UDP
   - **HYBRID**: Adaptive routing based on conditions
3. Choose a network scenario (ideal, good, moderate, poor, terrible)
4. Click "Start" to begin simulation

### Sending Test Packets

1. Ensure simulation is running
2. Select packet priority:
   - **Critical**: Requires reliability (uses TCP)
   - **Realtime**: Requires low latency (prefers UDP)
   - **Bulk**: Adaptive based on path quality
   - **Optional**: Best-effort (uses UDP)
3. Set packet count
4. Click "Send Packets"

### Monitoring Metrics

The dashboard displays:
- **Packet counters**: Sent, received, lost
- **Delivery ratio**: Percentage of packets successfully delivered
- **Latency**: Average round-trip time
- **Throughput**: Data transfer rate in Mbps
- **Protocol distribution**: TCP vs UDP usage
- **Path scores**: Real-time quality metrics for each path

## 🧪 Running Tests

```bash
# Run all tests
pytest backend/tests/

# Run with coverage
pytest backend/tests/ --cov=backend --cov-report=html

# Run specific test file
pytest backend/tests/test_models.py
```

## 📈 Benchmarking

Run comprehensive benchmarks comparing all modes across different network conditions:

```bash
python backend/utils/benchmark.py
```

Results are saved to `benchmark_results/` directory.

## 🔧 Configuration

### Network Scenarios

Predefined scenarios in `backend/emulator/network_emulator.py`:

- **ideal**: 1ms latency, 0% loss, 1000 Mbps
- **good**: 10ms latency, 0.1% loss, 100 Mbps
- **moderate**: 50ms latency, 2% loss, 50 Mbps
- **poor**: 150ms latency, 5% loss, 10 Mbps
- **terrible**: 300ms latency, 15% loss, 1 Mbps
- **drone_telemetry**: 80ms latency, 3% loss, 20 Mbps
- **live_streaming**: 30ms latency, 1% loss, 50 Mbps
- **industrial_iot**: 100ms latency, 4% loss, 5 Mbps
- **disaster_response**: 200ms latency, 10% loss, 2 Mbps

### Custom Network Conditions

Use the API to set custom conditions:

```bash
curl -X POST http://localhost:8000/api/network/conditions \
  -H "Content-Type: application/json" \
  -d '{
    "latency_ms": 100,
    "jitter_ms": 20,
    "packet_loss_rate": 0.05,
    "bandwidth_mbps": 10
  }'
```

## 🎓 Adaptive Routing Logic

The scheduler uses intelligent routing based on:

### Priority-Based Rules

1. **CRITICAL packets** → Always TCP (reliability required)
2. **REALTIME packets** → Prefer UDP (low latency required)
3. **OPTIONAL packets** → Always UDP (best-effort)
4. **BULK packets** → Adaptive based on path scores

### Path Scoring Algorithm

Each path (TCP/UDP) receives a score (0-100) based on:

```
Score = (RTT_score × 0.3) + 
        (Loss_score × 0.3) + 
        (Jitter_score × 0.15) + 
        (Throughput_score × 0.15) + 
        (Congestion_score × 0.1)
```

Where:
- Lower RTT = Higher score
- Lower loss = Higher score
- Lower jitter = Higher score
- Higher throughput = Higher score
- Lower congestion = Higher score

### Adaptive Switching

The system switches protocols when:
- Path score difference exceeds threshold (15 points)
- Path score falls below minimum threshold (40 points)
- Network conditions change significantly

## 📡 API Reference

### Simulation Control

- `POST /api/simulation/start` - Start simulation
- `POST /api/simulation/stop` - Stop simulation
- `GET /api/simulation/status` - Get status
- `POST /api/simulation/send` - Send test packets
- `POST /api/simulation/mode` - Change mode

### Network Control

- `POST /api/network/conditions` - Update conditions
- `POST /api/network/congestion` - Inject congestion
- `GET /api/network/scenarios` - List scenarios
- `POST /api/network/scenario/{name}` - Set scenario

### Metrics

- `GET /api/metrics` - Get current metrics
- `GET /api/metrics/comparison` - Compare modes

### WebSocket

- `WS /ws` - Real-time event stream

## 🔬 Research Applications

This simulator is suitable for:

1. **Protocol Research**
   - Comparing TCP vs UDP performance
   - Evaluating hybrid approaches
   - Testing adaptive algorithms

2. **Network Condition Studies**
   - Impact of latency on different protocols
   - Loss recovery mechanisms
   - Congestion control strategies

3. **Application Scenarios**
   - Drone telemetry systems
   - Live video streaming
   - Industrial IoT networks
   - Emergency communication systems

4. **Educational Purposes**
   - Understanding transport protocols
   - Learning network programming
   - Visualizing packet flow

## 📝 Project Structure

```
.
├── backend/
│   ├── core/              # Core models and simulation engine
│   ├── transport/         # TCP/UDP implementations
│   ├── scheduler/         # Adaptive routing logic
│   ├── emulator/          # Network emulation
│   ├── analytics/         # Metrics collection
│   ├── api/               # FastAPI server
│   ├── websocket/         # WebSocket manager
│   ├── utils/             # Utilities and benchmarks
│   ├── tests/             # Unit tests
│   └── main.py            # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API client
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app
│   └── package.json
├── docs/                  # Documentation
├── benchmark_results/     # Benchmark outputs
├── requirements.txt       # Python dependencies
├── docker-compose.yml     # Docker configuration
└── README.md
```

## 🐛 Troubleshooting

### Backend won't start
- Ensure Python 3.12+ is installed
- Check if port 8000 is available
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Frontend won't connect
- Ensure backend is running first
- Check if port 3000 is available
- Verify WebSocket connection in browser console

### No packets being sent
- Check if simulation is started
- Verify network conditions aren't too restrictive
- Check browser console for errors

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Additional routing algorithms
- More network scenarios
- Enhanced visualization
- Performance optimizations
- Additional test coverage

## 📄 License

This project is for educational and research purposes.

## 🎯 Future Enhancements

- [ ] Machine learning-based routing
- [ ] Multi-hop path simulation
- [ ] Encryption layer
- [ ] Mobile network scenarios (4G/5G)
- [ ] Satellite link simulation
- [ ] Real network interface integration
- [ ] Packet capture (pcap) export
- [ ] Advanced congestion control algorithms

## 📚 References

- RFC 793 - Transmission Control Protocol
- RFC 768 - User Datagram Protocol
- MPTCP - Multipath TCP
- QUIC - Quick UDP Internet Connections

## 👥 Authors

Final Year Project - HyPath (Hybrid Multi-Path Transport Protocol Simulator)

## 🙏 Acknowledgments

Built with:
- FastAPI - Modern Python web framework
- React - Frontend library
- Recharts - Charting library
- TailwindCSS - Utility-first CSS
- asyncio - Asynchronous I/O

---

**Note**: This is a simulation framework for research and educational purposes. For production use cases, consider established protocols like MPTCP or QUIC.
