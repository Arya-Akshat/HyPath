"""FastAPI server for REST API and WebSocket endpoints."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import logging

from backend.core.models import Protocol, PacketPriority, NetworkConditions
from backend.core.simulation_engine import SimulationEngine
from backend.emulator.network_emulator import ScenarioEmulator
from backend.websocket.ws_manager import ws_manager

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Hybrid Transport Protocol Simulator API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation engine
simulation_engine: Optional[SimulationEngine] = None


# Request models
class StartSimulationRequest(BaseModel):
    mode: str = "HYBRID"
    scenario: str = "moderate"


class UpdateConditionsRequest(BaseModel):
    latency_ms: float = 50.0
    jitter_ms: float = 10.0
    packet_loss_rate: float = 0.02
    bandwidth_mbps: float = 100.0
    corruption_rate: float = 0.0
    duplication_rate: float = 0.0
    reorder_rate: float = 0.0
    congestion_level: float = 0.0


class SendDataRequest(BaseModel):
    payload: str
    priority: str = "BULK"
    count: int = 1


class ChangeModeRequest(BaseModel):
    mode: str


# API endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    global simulation_engine
    simulation_engine = SimulationEngine()
    
    # Add event callback to broadcast to WebSocket clients
    async def broadcast_event(event):
        await ws_manager.queue_broadcast(event)
    
    simulation_engine.add_event_callback(broadcast_event)
    
    # Start WebSocket broadcaster
    asyncio.create_task(ws_manager.start_broadcaster())
    
    logger.info("API server started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    global simulation_engine
    if simulation_engine and simulation_engine.running:
        await simulation_engine.stop()
    ws_manager.stop()
    logger.info("API server stopped")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Hybrid Transport Protocol Simulator",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/api/simulation/start")
async def start_simulation(request: StartSimulationRequest):
    """Start simulation."""
    global simulation_engine
    
    if simulation_engine.running:
        raise HTTPException(status_code=400, detail="Simulation already running")
    
    # Set mode
    try:
        mode = Protocol[request.mode.upper()]
        simulation_engine.set_mode(mode)
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid mode: {request.mode}")
    
    # Set scenario
    conditions = ScenarioEmulator.get_scenario(request.scenario)
    simulation_engine.update_network_conditions(conditions)
    
    # Start simulation
    await simulation_engine.start()
    
    return {
        "status": "started",
        "mode": request.mode,
        "scenario": request.scenario,
        "session_id": simulation_engine.session_id
    }


@app.post("/api/simulation/stop")
async def stop_simulation():
    """Stop simulation."""
    global simulation_engine
    
    if not simulation_engine.running:
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    await simulation_engine.stop()
    
    return {"status": "stopped"}


@app.get("/api/simulation/status")
async def get_status():
    """Get simulation status."""
    global simulation_engine
    
    return {
        "running": simulation_engine.running,
        "session_id": simulation_engine.session_id,
        "mode": simulation_engine.scheduler.mode.value
    }


@app.post("/api/simulation/send")
async def send_data(request: SendDataRequest):
    """Send data packets."""
    global simulation_engine
    
    if not simulation_engine.running:
        raise HTTPException(status_code=400, detail="Simulation not running")
    
    try:
        priority = PacketPriority[request.priority.upper()]
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid priority: {request.priority}")
    
    # Send packets
    payload = request.payload.encode('utf-8')
    for i in range(request.count):
        await simulation_engine.send_data(payload, priority, i)
    
    return {
        "status": "sent",
        "count": request.count,
        "priority": request.priority
    }


@app.post("/api/simulation/mode")
async def change_mode(request: ChangeModeRequest):
    """Change simulation mode."""
    global simulation_engine
    
    try:
        mode = Protocol[request.mode.upper()]
        simulation_engine.set_mode(mode)
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid mode: {request.mode}")
    
    return {
        "status": "mode_changed",
        "mode": request.mode
    }


@app.post("/api/network/conditions")
async def update_conditions(request: UpdateConditionsRequest):
    """Update network conditions."""
    global simulation_engine
    
    conditions = NetworkConditions(
        latency_ms=request.latency_ms,
        jitter_ms=request.jitter_ms,
        packet_loss_rate=request.packet_loss_rate,
        bandwidth_mbps=request.bandwidth_mbps,
        corruption_rate=request.corruption_rate,
        duplication_rate=request.duplication_rate,
        reorder_rate=request.reorder_rate,
        congestion_level=request.congestion_level
    )
    
    simulation_engine.update_network_conditions(conditions)
    
    return {
        "status": "conditions_updated",
        "conditions": request.dict()
    }


@app.post("/api/network/congestion")
async def inject_congestion(level: float):
    """Inject network congestion."""
    global simulation_engine
    
    simulation_engine.emulator.inject_congestion(level)
    
    return {
        "status": "congestion_injected",
        "level": level
    }


@app.get("/api/network/scenarios")
async def get_scenarios():
    """Get available network scenarios."""
    return {
        "scenarios": [
            "ideal", "good", "moderate", "poor", "terrible",
            "drone_telemetry", "live_streaming", "industrial_iot", "disaster_response"
        ]
    }


@app.post("/api/network/scenario/{scenario_name}")
async def set_scenario(scenario_name: str):
    """Set network scenario."""
    global simulation_engine
    
    conditions = ScenarioEmulator.get_scenario(scenario_name)
    simulation_engine.update_network_conditions(conditions)
    
    return {
        "status": "scenario_set",
        "scenario": scenario_name
    }


@app.get("/api/metrics")
async def get_metrics():
    """Get current metrics."""
    global simulation_engine
    
    return simulation_engine.get_metrics()


@app.get("/api/metrics/comparison")
async def get_comparison():
    """Get mode comparison metrics."""
    global simulation_engine
    
    return simulation_engine.metrics_collector.compare_modes()


# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await ws_manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Echo back for testing
            await ws_manager.send_personal_message(
                {"type": "echo", "data": data},
                websocket
            )
            
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
