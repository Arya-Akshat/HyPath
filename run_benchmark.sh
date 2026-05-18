#!/bin/bash

echo "=========================================="
echo "Running Benchmark Suite"
echo "=========================================="

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Create benchmark results directory
mkdir -p benchmark_results

# Run benchmark
echo "Starting comprehensive benchmark..."
python3 backend/utils/benchmark.py

echo ""
echo "Benchmark complete! Results saved to benchmark_results/"
