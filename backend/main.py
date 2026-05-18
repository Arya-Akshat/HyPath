"""Main entry point for the hybrid transport protocol simulator."""

import asyncio
import logging
import sys
import uvicorn
from backend.api.server import app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('simulation.log')
    ]
)

logger = logging.getLogger(__name__)


def main():
    """Main entry point."""
    logger.info("=" * 60)
    logger.info("Hybrid Multi-Path Transport Protocol Simulator")
    logger.info("=" * 60)
    
    # Run FastAPI server with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )


if __name__ == "__main__":
    main()
