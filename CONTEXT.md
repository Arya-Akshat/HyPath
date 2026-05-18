You are a senior distributed systems engineer, networking researcher, full-stack architect, and systems programming expert.

Your task is to build a COMPLETE production-quality final year project from the specification document provided in the workspace.

The project is a:

“Hybrid Multi-Path Transport Protocol Simulator using TCP + UDP Adaptive Routing”

The implementation must be COMPLETE, runnable, modular, testable, and visually demonstrable.

IMPORTANT:
- Do NOT generate placeholders.
- Do NOT generate pseudo-code.
- Do NOT leave TODOs.
- Do NOT skip implementation.
- Do NOT stop midway.
- Do NOT ask for confirmation.
- Build the ENTIRE project in one go.
- Every module must compile and run.
- Automatically fix dependency issues if found.
- Automatically generate missing configs/files/scripts.
- Continuously validate all modules after implementation.
- If any test fails, fix the issue before proceeding.
- Ensure the final project is runnable using a single command.

====================================================
PROJECT GOAL
====================================================

Build a full simulation framework that:

1. Uses BOTH TCP and UDP communication
2. Dynamically routes packets based on network conditions
3. Simulates network impairments:
   - packet loss
   - delay
   - jitter
   - congestion
   - reordering
   - bandwidth throttling
4. Reassembles packets correctly
5. Performs retransmission logic
6. Compares:
   - TCP-only
   - UDP-only
   - Hybrid mode
7. Provides a real-time dashboard visualization
8. Produces analytics and benchmarking reports
9. Demonstrates adaptive path switching
10. Is suitable for:
   - viva
   - GitHub portfolio
   - research paper
   - final year demo

====================================================
MANDATORY TECH STACK
====================================================

Backend:
- Python 3.12+

Networking:
- socket
- asyncio
- threading where required

Simulation:
- SimPy OR custom event-driven simulator

Frontend:
- React + Vite
- TypeScript
- TailwindCSS

Realtime communication:
- WebSockets

Visualization:
- Chart.js OR Recharts

Testing:
- pytest

Packaging:
- Docker support
- docker-compose

Optional acceleration:
- uvloop if available

====================================================
REQUIRED PROJECT STRUCTURE
====================================================

Create a CLEAN production-grade structure.

Example:

project-root/
│
├── backend/
│   ├── core/
│   ├── transport/
│   ├── scheduler/
│   ├── emulator/
│   ├── analytics/
│   ├── visualization/
│   ├── tests/
│   ├── config/
│   ├── api/
│   ├── websocket/
│   ├── utils/
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── charts/
│   ├── websocket/
│   └── services/
│
├── docs/
├── benchmark_results/
├── scripts/
├── docker/
├── README.md
├── docker-compose.yml
└── requirements.txt

====================================================
CORE FEATURES
====================================================

IMPLEMENT ALL OF THESE FULLY.

----------------------------------------------------
1. TCP + UDP Hybrid Communication
----------------------------------------------------

Implement:
- TCP socket server/client
- UDP socket server/client
- unified packet abstraction layer
- packet serialization/deserialization
- session management
- connection lifecycle

Packets must contain:
- packet_id
- sequence_number
- timestamp
- protocol_used
- priority
- payload
- checksum
- retransmission_count
- path_id

====================================================
2. PACKET CLASSIFICATION
====================================================

Create classification logic:

- CRITICAL
- REALTIME
- BULK
- OPTIONAL

Rules:
- critical → TCP preferred
- realtime → UDP preferred
- bulk → adaptive
- optional → UDP fallback

====================================================
3. ADAPTIVE PATH MANAGER
====================================================

Implement intelligent routing.

Track:
- RTT
- loss rate
- jitter
- throughput
- congestion
- retransmissions
- queue size

Each path gets a dynamic score.

Implement:
- weighted scoring
- protocol switching
- failover
- adaptive load balancing

Routing decisions must change LIVE during runtime.

====================================================
4. NETWORK EMULATOR
====================================================

Build a REAL simulation layer.

Support:
- artificial latency
- random packet drops
- packet duplication
- packet corruption
- bandwidth throttling
- congestion spikes
- packet reordering
- jitter

Expose emulator configs dynamically.

====================================================
5. RETRANSMISSION SYSTEM
====================================================

Implement:
- ACK packets
- NACK packets
- timeout-based retransmission
- selective retransmission
- missing packet detection

Receiver must request missing chunks.

====================================================
6. REASSEMBLY ENGINE
====================================================

Receiver must:
- reorder packets
- detect missing packets
- rebuild original payload
- validate checksums
- recover corrupted transfers

====================================================
7. MODES
====================================================

Implement ALL modes:

A. TCP_ONLY
B. UDP_ONLY
C. HYBRID

Allow live switching.

====================================================
8. ANALYTICS ENGINE
====================================================

Compute:
- delivery ratio
- avg latency
- throughput
- jitter
- retransmission count
- packet loss
- congestion impact
- protocol utilization
- path utilization
- efficiency score

Store metrics in structured format.

====================================================
9. REALTIME DASHBOARD
====================================================

Build a BEAUTIFUL frontend.

Dashboard must include:
- live packet flow
- TCP vs UDP traffic
- latency graphs
- throughput graphs
- loss graphs
- retransmission indicators
- protocol utilization pie chart
- path health indicators
- adaptive switching timeline
- packet counters
- active sessions

UI should feel modern and research-grade.

Use:
- dark theme
- animated graphs
- responsive design
- smooth updates

====================================================
10. NETWORK TOPOLOGY VISUALIZATION
====================================================

Show:
- sender
- receiver
- TCP path
- UDP path
- emulator
- packet animations

Visualize:
- dropped packets
- retransmissions
- congestion
- switching events

====================================================
11. BENCHMARKING SYSTEM
====================================================

Automatically benchmark:

1. TCP_ONLY
2. UDP_ONLY
3. HYBRID

Under:
- low latency
- high latency
- high packet loss
- congestion
- unstable network

Generate:
- charts
- JSON reports
- CSV reports

====================================================
12. SCENARIO SYSTEM
====================================================

Implement configurable scenarios:

- drone telemetry
- live streaming
- industrial IoT
- remote healthcare
- disaster response

Each scenario changes:
- packet priorities
- latency sensitivity
- retransmission behavior

====================================================
13. API LAYER
====================================================

Build REST API endpoints.

Required endpoints:
- start simulation
- stop simulation
- update emulator settings
- fetch analytics
- switch mode
- inject congestion
- fetch topology state

Use FastAPI.

====================================================
14. WEBSOCKET LAYER
====================================================

Frontend must receive:
- realtime metrics
- packet updates
- topology events
- routing decisions
- congestion alerts

====================================================
15. CONFIGURATION SYSTEM
====================================================

Implement:
- YAML-based configs
- runtime config reload
- preset profiles

====================================================
16. LOGGING
====================================================

Add structured logging:
- routing decisions
- retransmissions
- failures
- packet drops
- congestion events

====================================================
17. SECURITY
====================================================

Add:
- checksum validation
- malformed packet rejection
- packet integrity verification

Optional:
- AES encryption mode

====================================================
18. TESTING
====================================================

Create COMPLETE tests.

Backend:
- unit tests
- integration tests
- protocol tests
- retransmission tests
- emulator tests

Frontend:
- component tests

System:
- end-to-end simulation tests

Coverage target:
- minimum 85%

====================================================
19. PERFORMANCE OPTIMIZATION
====================================================

Optimize:
- async processing
- packet queues
- websocket broadcasting
- metric aggregation

Avoid:
- blocking loops
- memory leaks
- unbounded queues

====================================================
20. DOCKERIZATION
====================================================

Provide:
- Dockerfile for frontend
- Dockerfile for backend
- docker-compose setup

Single command should launch everything.

====================================================
21. README
====================================================

Generate an EXTREMELY detailed README.

Include:
- architecture
- setup
- screenshots placeholders
- demo instructions
- explanation of adaptive routing
- benchmarking guide
- protocol explanation
- API documentation
- future scope
- research angle
- viva questions
- troubleshooting

====================================================
22. DOCUMENTATION
====================================================

Generate:
- architecture diagrams (Mermaid)
- packet flow diagrams
- sequence diagrams
- routing logic explanation

====================================================
23. RESEARCH OUTPUTS
====================================================

Generate:
- benchmark comparison tables
- hybrid vs TCP vs UDP analysis
- conclusions
- statistical summaries

====================================================
24. AUTOMATED VALIDATION
====================================================

After implementing each major module:

1. Run tests
2. Fix failures
3. Verify imports
4. Verify websocket events
5. Verify frontend builds
6. Verify backend launches
7. Verify Docker builds

Do NOT continue while broken.

====================================================
25. FINAL EXECUTION EXPERIENCE
====================================================

The final project must work via:

Backend:
python main.py

Frontend:
npm run dev

OR:

docker-compose up

====================================================
26. FRONTEND QUALITY REQUIREMENTS
====================================================

Frontend must NOT look like a student toy project.

It should look:
- modern
- research-grade
- production-quality

Use:
- glassmorphism
- smooth animations
- dynamic indicators
- status chips
- animated packet flow
- interactive charts

====================================================
27. IMPLEMENTATION DEPTH
====================================================

You are NOT allowed to:
- oversimplify networking
- fake metrics
- hardcode graphs
- generate static data
- mock the adaptive system

All metrics must originate from actual runtime simulation logic.

====================================================
28. ADAPTIVE LOGIC REQUIREMENTS
====================================================

The routing engine MUST:
- genuinely change behavior
- dynamically reroute traffic
- react to packet loss
- react to congestion
- react to latency changes

The system must visibly adapt during execution.

====================================================
29. CODE QUALITY
====================================================

Code must be:
- modular
- typed
- documented
- maintainable
- scalable

Use:
- dataclasses
- pydantic
- enums
- dependency injection where useful

====================================================
30. FINAL OUTPUT REQUIREMENTS
====================================================

At the end:
- ensure entire project compiles
- ensure tests pass
- ensure frontend renders
- ensure backend launches
- ensure websocket communication works
- ensure Docker works
- ensure benchmark scripts work

Then provide:
1. final architecture summary
2. startup commands
3. test commands
4. benchmark commands
5. demo walkthrough

====================================================
31. IMPLEMENTATION STRATEGY
====================================================

Implement in this order:

1. backend core models
2. packet abstraction
3. TCP/UDP transport
4. emulator
5. scheduler
6. adaptive routing
7. retransmission
8. reassembly
9. analytics
10. API
11. websocket layer
12. frontend
13. benchmarking
14. tests
15. dockerization
16. documentation

====================================================
32. IMPORTANT EXECUTION RULES
====================================================

- Continue automatically until EVERYTHING is complete.
- Never stop after generating only structure.
- Never ask for permission.
- Never output partial implementation.
- Fully implement all modules.
- Auto-resolve dependency issues.
- Auto-fix runtime issues.
- Validate continuously.
- Produce a polished final system.

BEGIN IMPLEMENTATION NOW.