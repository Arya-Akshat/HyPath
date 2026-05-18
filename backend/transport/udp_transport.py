"""UDP transport implementation."""

import asyncio
import logging
from typing import Optional, Callable, Tuple
from backend.core.models import Packet

logger = logging.getLogger(__name__)


class UDPProtocol(asyncio.DatagramProtocol):
    """UDP protocol handler."""
    
    def __init__(self, packet_handler: Optional[Callable] = None):
        """Initialize UDP protocol."""
        self.packet_handler = packet_handler
        self.transport: Optional[asyncio.DatagramTransport] = None
    
    def connection_made(self, transport):
        """Called when connection is established."""
        self.transport = transport
    
    def datagram_received(self, data: bytes, addr: Tuple[str, int]):
        """Called when datagram is received."""
        try:
            packet = Packet.deserialize(data)
            logger.debug(f"UDP received packet {packet.packet_id} from {addr}")
            
            if self.packet_handler:
                asyncio.create_task(self.packet_handler(packet))
                
        except Exception as e:
            logger.error(f"UDP datagram error: {e}")
    
    def error_received(self, exc):
        """Called when error occurs."""
        logger.error(f"UDP error: {exc}")


class UDPServer:
    """Async UDP server for receiving packets."""
    
    def __init__(self, host: str = '127.0.0.1', port: int = 9999):
        """Initialize UDP server."""
        self.host = host
        self.port = port
        self.transport: Optional[asyncio.DatagramTransport] = None
        self.protocol: Optional[UDPProtocol] = None
        self.packet_handler: Optional[Callable] = None
    
    def set_packet_handler(self, handler: Callable):
        """Set callback for received packets."""
        self.packet_handler = handler
    
    async def start(self):
        """Start UDP server."""
        loop = asyncio.get_event_loop()
        
        self.transport, self.protocol = await loop.create_datagram_endpoint(
            lambda: UDPProtocol(self.packet_handler),
            local_addr=(self.host, self.port)
        )
        
        logger.info(f"UDP server started on {self.host}:{self.port}")
    
    async def stop(self):
        """Stop UDP server."""
        if self.transport:
            self.transport.close()
        logger.info("UDP server stopped")


class UDPClient:
    """Async UDP client for sending packets."""
    
    def __init__(self, host: str = '127.0.0.1', port: int = 9999):
        """Initialize UDP client."""
        self.host = host
        self.port = port
        self.transport: Optional[asyncio.DatagramTransport] = None
        self.protocol: Optional[UDPProtocol] = None
        self.connected = False
    
    async def connect(self):
        """Initialize UDP client."""
        loop = asyncio.get_event_loop()
        
        self.transport, self.protocol = await loop.create_datagram_endpoint(
            lambda: UDPProtocol(),
            remote_addr=(self.host, self.port)
        )
        
        self.connected = True
        logger.info(f"UDP client initialized for {self.host}:{self.port}")
    
    async def send_packet(self, packet: Packet) -> bool:
        """Send packet over UDP."""
        if not self.connected or not self.transport:
            logger.error("UDP client not connected")
            return False
        
        try:
            packet_data = packet.serialize()
            self.transport.sendto(packet_data)
            logger.debug(f"UDP sent packet {packet.packet_id}")
            return True
            
        except Exception as e:
            logger.error(f"UDP send error: {e}")
            return False
    
    async def disconnect(self):
        """Close UDP client."""
        if self.transport:
            self.transport.close()
        self.connected = False
        logger.info("UDP client disconnected")
