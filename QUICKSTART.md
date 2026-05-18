# Quick Start Guide

Get the Hybrid Transport Protocol Simulator running in 5 minutes!

## Prerequisites

- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ (Node.js 20 recommended)
- npm or yarn
- Git

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd hybrid-transport-simulator
```

### 2. Backend Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

## Running the Application

### Method 1: Using Shell Scripts (Recommended)

**Terminal 1 - Backend:**
```bash
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start_frontend.sh
```

### Method 2: Manual Start

**Terminal 1 - Backend:**
```bash
source venv/bin/activate
python backend/main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Method 3: Docker Compose

```bash
docker-compose up
```

## Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## First Simulation

1. Open http://localhost:3000 in your browser
2. Select **HYBRID** mode
3. Choose **moderate** network scenario
4. Click **Start** button
5. Click **Send Packets** to send test data
6. Watch the real-time metrics and charts update!

## Understanding the Dashboard

### Top Metrics
- **Packets Sent**: Total packets transmitted
- **Packets Received**: Successfully delivered packets
- **Delivery Ratio**: Percentage of successful deliveries
- **Avg Latency**: Average round-trip time

### Charts
- **Latency Over Time**: Shows TCP vs UDP latency
- **Protocol Distribution**: Pie chart of TCP/UDP usage
- **Throughput**: Data transfer rate over time
- **Path Scores**: Real-time quality metrics for each path

### Control Panel
- **Mode**: Switch between TCP, UDP, or HYBRID
- **Network Scenario**: Select predefined conditions
- **Send Test Data**: Generate packets with different priorities

## Testing Different Scenarios

### 1. TCP-Only Mode
```
Mode: TCP
Scenario: moderate
Priority: CRITICAL
```
**Expected**: All packets use TCP, high reliability, moderate latency

### 2. UDP-Only Mode
```
Mode: UDP
Scenario: moderate
Priority: REALTIME
```
**Expected**: All packets use UDP, lower latency, some packet loss

### 3. Hybrid Mode (Adaptive)
```
Mode: HYBRID
Scenario: moderate
Priority: BULK
```
**Expected**: Dynamic switching between TCP/UDP based on conditions

### 4. Poor Network Conditions
```
Mode: HYBRID
Scenario: poor
Priority: CRITICAL
```
**Expected**: More retransmissions, adaptive routing kicks in

## Running Tests

```bash
./run_tests.sh
```

Or manually:
```bash
source venv/bin/activate
pytest backend/tests/ -v
```

## Running Benchmarks

```bash
./run_benchmark.sh
```

Or manually:
```bash
source venv/bin/activate
python backend/utils/benchmark.py
```

Results will be saved to `benchmark_results/` directory.

## API Examples

### Start Simulation
```bash
curl -X POST http://localhost:8000/api/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"mode": "HYBRID", "scenario": "moderate"}'
```

### Send Packets
```bash
curl -X POST http://localhost:8000/api/simulation/send \
  -H "Content-Type: application/json" \
  -d '{"payload": "test data", "priority": "BULK", "count": 10}'
```

### Get Metrics
```bash
curl http://localhost:8000/api/metrics
```

### Change Network Conditions
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

### Stop Simulation
```bash
curl -X POST http://localhost:8000/api/simulation/stop
```

## Troubleshooting

### Backend won't start

**Error**: `Address already in use`
**Solution**: Kill process on port 8000
```bash
lsof -ti:8000 | xargs kill -9
```

**Error**: `Module not found`
**Solution**: Ensure virtual environment is activated and dependencies installed
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend won't start

**Error**: `Port 3000 already in use`
**Solution**: Kill process on port 3000 or change port in `vite.config.ts`
```bash
lsof -ti:3000 | xargs kill -9
```

**Error**: `Module not found`
**Solution**: Install dependencies
```bash
cd frontend
npm install
```

### WebSocket not connecting

**Issue**: Dashboard shows "Disconnected"
**Solution**: 
1. Ensure backend is running
2. Check browser console for errors
3. Verify CORS settings in `backend/api/server.py`

### No packets being sent

**Issue**: Clicking "Send Packets" does nothing
**Solution**:
1. Ensure simulation is started (click Start button)
2. Check browser console for errors
3. Verify backend logs for errors

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Check [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- Explore different network scenarios
- Run comprehensive benchmarks
- Modify routing algorithms in `backend/scheduler/adaptive_scheduler.py`
- Customize network conditions in `backend/emulator/network_emulator.py`

## Common Use Cases

### 1. Research: Compare TCP vs UDP
```bash
# Run benchmark comparing all modes
./run_benchmark.sh
```

### 2. Demo: Show Adaptive Routing
```bash
# Start in HYBRID mode
# Send CRITICAL packets (uses TCP)
# Send REALTIME packets (uses UDP)
# Watch protocol distribution chart
```

### 3. Testing: Simulate Poor Network
```bash
# Set scenario to "terrible"
# Send packets with different priorities
# Observe retransmissions and adaptive behavior
```

### 4. Education: Understand Protocols
```bash
# Start in TCP mode, observe reliability
# Switch to UDP mode, observe speed
# Switch to HYBRID, observe adaptation
```

## Performance Tips

1. **Reduce latency**: Use "ideal" or "good" scenarios
2. **Increase throughput**: Reduce packet loss rate
3. **Test reliability**: Use "poor" or "terrible" scenarios
4. **Stress test**: Send 1000+ packets at once

## Getting Help

- Check logs: `simulation.log` (backend) and browser console (frontend)
- Review API docs: http://localhost:8000/docs
- Read architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Check issues: GitHub issues page

## Clean Up

```bash
# Stop all processes
# Ctrl+C in both terminals

# Deactivate virtual environment
deactivate

# Remove virtual environment (optional)
rm -rf venv

# Remove node modules (optional)
rm -rf frontend/node_modules
```

## Docker Cleanup

```bash
# Stop containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

---

**Ready to explore?** Start the application and begin your first simulation! 🚀
