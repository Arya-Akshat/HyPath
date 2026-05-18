"""WebSocket manager for real-time communication with frontend."""

import asyncio
import json
import logging
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and broadcasts."""
    
    def __init__(self):
        """Initialize WebSocket manager."""
        self.active_connections: Set[WebSocket] = set()
        self.broadcast_queue: asyncio.Queue = asyncio.Queue()
        self.running = False
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection."""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        if not self.active_connections:
            return
        
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.add(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def start_broadcaster(self):
        """Start background broadcaster task."""
        self.running = True
        while self.running:
            try:
                message = await asyncio.wait_for(self.broadcast_queue.get(), timeout=0.1)
                await self.broadcast(message)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Broadcaster error: {e}")
    
    async def queue_broadcast(self, message: dict):
        """Queue message for broadcast."""
        await self.broadcast_queue.put(message)
    
    def stop(self):
        """Stop broadcaster."""
        self.running = False


# Global WebSocket manager instance
ws_manager = WebSocketManager()
