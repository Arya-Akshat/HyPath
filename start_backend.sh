#!/bin/bash

echo "=========================================="
echo "Starting Hybrid Transport Protocol Simulator Backend"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt 2>/dev/null || echo "Some dependencies may need manual installation"

# Start backend
echo ""
echo "Starting backend server on http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
python3 backend/main.py
