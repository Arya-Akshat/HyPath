#!/bin/bash

echo "=========================================="
echo "Running Tests"
echo "=========================================="

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run tests
echo "Running backend tests..."
python3 -m pytest backend/tests/ -v --tb=short

echo ""
echo "Tests complete!"
