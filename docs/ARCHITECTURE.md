# System Architecture

## Overview

The Hybrid Multi-Path Transport Protocol Simulator is a distributed system consisting of a Python backend and React frontend, communicating via REST API and WebSocket connections.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │   Charts     │  │   Controls   │          │
│  │  Components  │  │  (Recharts)  │  │    Panel     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │         WebSocket Hook + API Service             │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                            │
                    WebSocket + REST API
                            │
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                             │
│  ┌──────────────────────────────────────────────────┐           │
│  │              FastAPI Server                      │           │
│  │  ┌────────────────┐  ┌────────────────┐         │           │
│  │  │  REST Routes   │  │  WebSocket     │         │           │
│  │  └────────────────┘  └────────────────┘         │           │
│  └──────────────────────────────────────────────────┘           │
│                            │                                     │
│  ┌──────────────────────────────────────────────────┐           │
│  │           Simulation Engine                      │           │
│  │  ┌────────────────────────────────────────────┐  │           │
│  │  │  Event Loop & Packet Processing            │  │           │
│  │  └────────────────────────────────────────────┘  │           │
│  └──────────────────────────────────────────────────┘           │
│         │              │              │              │           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Adaptive │  │ Network  │  │ Retrans  │  │ Analytics│        │
│  │Scheduler │  │ Emulator │  │ Manager  │  │Collector │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│         │              │              │              │           │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Transport Layer                          │           │
│  │  ┌────────────────┐  ┌────────────────┐         │           │
│  │  │  TCP Server/   │  │  UDP Server/   │         │           │
│  │  │    Client      │  │    Client      │         │           │
│  │  └────────────────┘  └────────────────┘         │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Simulation Engine

**Location**: `backend/core/simulation_engine.py`

**Responsibilities**:
- Orchestrates all simulation components
- Manages packet lifecycle
- Coordinates between transport, emulation, and scheduling
- Emits events to WebSocket clients

**Key Methods**:
- `start()`: Initialize and start simulation
- `stop()`: Gracefully stop simulation
- `send_data()`: Queue packets for transmission
- `_send_packet()`: Process and route individual packets
- `_handle_received_packet()`: Process received packets

### 2. Adaptive Scheduler

**Location**: `backend/scheduler/adaptive_scheduler.py`

**Responsibilities**:
- Select optimal protocol for each packet
- Track path metrics (TCP and UDP)
- Implement priority-based routing rules
- Calculate path quality scores

**Routing Algorithm**:
```python
def select_protocol(packet):
    if mode == TCP_ONLY:
        return TCP
    if mode == UDP_ONLY:
        return UDP
    
    # Hybrid mode
    if packet.priority == CRITICAL:
        return TCP  # Reliability required
    elif packet.priority == REALTIME:
        return UDP if udp_score > threshold else TCP
    elif packet.priority == OPTIONAL:
        return UDP  # Best effort
    else:  # BULK
        return protocol_with_better_score()
```

**Path Scoring**:
```
Score = RTT_score(30%) + Loss_score(30%) + 
        Jitter_score(15%) + Throughput_score(15%) + 
        Congestion_score(10%)
```

### 3. Network Emulator

**Location**: `backend/emulator/network_emulator.py`

**Responsibilities**:
- Simulate network impairments
- Apply latency, jitter, packet loss
- Throttle bandwidth
- Corrupt, duplicate, or reorder packets

**Processing Pipeline**:
```
Packet → Loss Check → Corruption → Latency/Jitter → 
         Bandwidth Throttle → Reordering → Output
```

### 4. Transport Layer

**Locations**: 
- `backend/transport/tcp_transport.py`
- `backend/transport/udp_transport.py`

**TCP Implementation**:
- Async server using `asyncio.start_server()`
- Stream-based communication
- Packet size prefix (4 bytes) + packet data
- Connection management

**UDP Implementation**:
- Datagram protocol using `asyncio.DatagramProtocol`
- Connectionless communication
- Direct packet serialization

### 5. Retransmission Manager

**Location**: `backend/transport/retransmission.py`

**Responsibilities**:
- Track packets awaiting ACK
- Implement timeout-based retransmission
- Handle ACK/NACK packets
- Manage retry limits

**Retransmission Logic**:
```
Send Packet → Start Timer → Wait for ACK
                ↓
            Timeout?
                ↓
        Retries < Max? → Yes → Retransmit
                ↓
               No → Drop
```

### 6. Reassembly Engine

**Location**: `backend/transport/retransmission.py`

**Responsibilities**:
- Reorder out-of-sequence packets
- Detect missing packets
- Verify checksums
- Reconstruct original data stream

**Reassembly Process**:
```
Receive Packet → Verify Checksum → Store by Sequence
                                         ↓
                                  Find Consecutive
                                         ↓
                                  Return Ordered List
```

### 7. Metrics Collector

**Location**: `backend/analytics/metrics_collector.py`

**Responsibilities**:
- Track session metrics
- Calculate delivery ratio, latency, throughput
- Compute efficiency scores
- Generate comparison reports

**Metrics Tracked**:
- Packets: sent, received, lost, retransmitted
- Bytes: sent, received
- Latency: average, jitter
- Protocol usage: TCP vs UDP percentages
- Path metrics: RTT, loss rate

### 8. WebSocket Manager

**Location**: `backend/websocket/ws_manager.py`

**Responsibilities**:
- Manage WebSocket connections
- Broadcast events to all clients
- Handle connection lifecycle
- Queue messages for broadcast

**Event Types**:
- `simulation_started`
- `simulation_stopped`
- `packet_sent`
- `packet_received`
- `packet_dropped`
- `packet_retransmitted`
- `packets_reassembled`

## Data Flow

### Packet Transmission Flow

```
1. User sends data via API
   ↓
2. Simulation Engine creates Packet
   ↓
3. Adaptive Scheduler selects protocol
   ↓
4. Network Emulator applies impairments
   ↓
5. Transport Layer sends packet
   ↓
6. Retransmission Manager tracks packet
   ↓
7. Metrics Collector records send
   ↓
8. WebSocket broadcasts event
```

### Packet Reception Flow

```
1. Transport Layer receives packet
   ↓
2. Simulation Engine handles packet
   ↓
3. Reassembly Engine reorders packet
   ↓
4. Metrics Collector records receive
   ↓
5. ACK sent back to sender
   ↓
6. Retransmission Manager clears tracking
   ↓
7. WebSocket broadcasts event
```

## Frontend Architecture

### Component Hierarchy

```
App
├── Header
│   ├── Connection Status
│   └── Simulation Status
├── ControlPanel
│   ├── Mode Selection
│   ├── Scenario Selection
│   └── Send Data Form
└── Dashboard
    ├── MetricsCards (x8)
    ├── LatencyChart
    ├── ProtocolPieChart
    ├── ThroughputChart
    └── PathScores
```

### State Management

- **Local State**: React useState for UI state
- **WebSocket State**: Custom useWebSocket hook
- **API State**: Direct API calls with async/await

### Real-time Updates

```
WebSocket Event → useWebSocket Hook → State Update → 
Component Re-render → Chart Update
```

## API Endpoints

### Simulation Control
- `POST /api/simulation/start` - Start simulation
- `POST /api/simulation/stop` - Stop simulation
- `GET /api/simulation/status` - Get status
- `POST /api/simulation/send` - Send packets
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

## Performance Considerations

### Backend Optimizations
- Async I/O for all network operations
- Non-blocking packet processing
- Efficient queue management
- Minimal serialization overhead

### Frontend Optimizations
- Chart data windowing (last 30-100 points)
- Debounced state updates
- Memoized components
- Efficient re-rendering

## Scalability

### Current Limitations
- Single-threaded event loop
- In-memory metrics storage
- Local transport only

### Future Enhancements
- Multi-process architecture
- Database-backed metrics
- Distributed simulation
- Real network interfaces

## Security Considerations

### Current Implementation
- Checksum verification
- Malformed packet rejection
- CORS configuration

### Production Requirements
- Authentication/Authorization
- Rate limiting
- Input validation
- Encrypted transport (TLS)

## Testing Strategy

### Unit Tests
- Model serialization/deserialization
- Path metric calculations
- Scheduler routing logic
- Checksum verification

### Integration Tests
- End-to-end packet flow
- Protocol switching
- Retransmission logic
- Metrics accuracy

### Performance Tests
- Throughput benchmarks
- Latency measurements
- Resource utilization
- Concurrent connections

## Deployment

### Development
```bash
# Terminal 1
python backend/main.py

# Terminal 2
cd frontend && npm run dev
```

### Production (Docker)
```bash
docker-compose up
```

### Environment Variables
- `PYTHONUNBUFFERED=1` - Unbuffered Python output
- `VITE_API_URL` - Backend API URL for frontend

## Monitoring

### Logs
- Backend: `simulation.log`
- Frontend: Browser console
- Docker: `docker-compose logs`

### Metrics
- Real-time dashboard
- Benchmark reports
- JSON exports

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in configuration
2. **WebSocket disconnects**: Check CORS settings
3. **High latency**: Reduce emulation parameters
4. **Memory usage**: Limit packet history

### Debug Mode

Enable verbose logging:
```python
logging.basicConfig(level=logging.DEBUG)
```

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [asyncio Documentation](https://docs.python.org/3/library/asyncio.html)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)
