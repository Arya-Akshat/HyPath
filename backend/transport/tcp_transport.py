"""TCP transport implementation."""

import asyncio
import logging
from typing import Optional, Callable
from backend.core.models import Packet, Protocol

logger = logging.getLogger(__name__)


class TCPServer:
    """Async TCP server for receiving packets."""
    
    def __init__(self, host: str = '127.0.0.1', port: int = 8888):
        """Initialize TCP server."""
        self.host = host
        self.port = port
        self.server: Optional[asyncio.Server] = None
        self.clients = []
        self.packet_handler: Optional[Callable] = None
        self.running = False
    
    def set_packet_handler(self, handler: Callable):
        """Set callback for received packets."""
        self.packet_handler = handler
    
    async def handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handle individual client connection."""
        addr = writer.get_extra_info('peername')
        logger.info(f"TCP client connected: {addr}")
        self.clients.append((reader, writer))
        
        try:
            while self.running:
                # Read packet size first (4 bytes)
                size_data = await reader.readexactly(4)
                packet_size = int.from_bytes(size_data, byteorder='big')
                
                # Read packet data
                packet_data = await reader.readexactly(packet_size)
                
                # Deserialize packet
                packet = Packet.deserialize(packet_data)
                logger.debug(f"TCP received packet {packet.packet_id}")
                
                # Call packet handler
                if self.packet_handler:
                    await self.packet_handler(packet)
                
        except asyncio.IncompleteReadError:
            logger.info(f"TCP client disconnected: {addr}")
        except Exception as e:
            logger.error(f"TCP client error: {e}")
        finally:
            writer.close()
            await writer.wait_closed()
            if (reader, writer) in self.clients:
                self.clients.remove((reader, writer))
    
    async def start(self):
        """Start TCP server."""
        self.running = True
        self.server = await asyncio.start_server(
            self.handle_client,
            self.host,
            self.port
        )
        logger.info(f"TCP server started on {self.host}:{self.port}")
    
    async def stop(self):
        """Stop TCP server."""
        self.running = False
        if self.server:
            self.server.close()
            await self.server.wait_closed()
        
        # Close all client connections
        for reader, writer in self.clients:
            writer.close()
            await writer.wait_closed()
        
        self.clients.clear()
        logger.info("TCP server stopped")


class TCPClient:
    """Async TCP client for sending packets."""
    
    def __init__(self, host: str = '127.0.0.1', port: int = 8888):
        """Initialize TCP client."""
        self.host = host
        self.port = port
        self.reader: Optional[asyncio.StreamReader] = None
        self.writer: Optional[asyncio.StreamWriter] = None
        self.connected = False
    
    async def connect(self):
        """Connect to TCP server."""
        try:
            self.reader, self.writer = await asyncio.open_connection(
                self.host,
                self.port
            )
            self.connected = True
            logger.info(f"TCP client connected to {self.host}:{self.port}")
        except Exception as e:
            logger.error(f"TCP connection failed: {e}")
            raise
    
    async def send_packet(self, packet: Packet) -> bool:
        """Send packet over TCP."""
        if not self.connected or not self.writer:
            logger.error("TCP client not connected")
            return False
        
        try:
            # Serialize packet
            packet_data = packet.serialize()
            packet_size = len(packet_data)
            
            # Send size first, then data
            self.writer.write(packet_size.to_bytes(4, byteorder='big'))
            self.writer.write(packet_data)
            await self.writer.drain()
            
            logger.debug(f"TCP sent packet {packet.packet_id}")
            return True
            
        except Exception as e:
            logger.error(f"TCP send error: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from server."""
        if self.writer:
            self.writer.close()
            await self.writer.wait_closed()
        self.connected = False
        logger.info("TCP client disconnected")
