#!/bin/bash

echo "=========================================="
echo "Starting Hybrid Transport Protocol Simulator Frontend"
echo "=========================================="

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start frontend
echo ""
echo "Starting frontend on http://localhost:3000"
echo ""
npm run dev
