"""Benchmarking system for comparing modes."""

import asyncio
import json
import time
from pathlib import Path
from typing import List, Dict
from backend.core.models import Protocol, PacketPriority
from backend.core.simulation_engine import SimulationEngine
from backend.emulator.network_emulator import ScenarioEmulator


class BenchmarkRunner:
    """Runs benchmarks across different modes and scenarios."""
    
    def __init__(self, output_dir: str = "benchmark_results"):
        """Initialize benchmark runner."""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.results: List[Dict] = []
    
    async def run_benchmark(
        self,
        mode: Protocol,
        scenario: str,
        packet_count: int = 100,
        duration: int = 30
    ) -> Dict:
        """Run single benchmark."""
        print(f"\n{'='*60}")
        print(f"Running benchmark: {mode.value} mode, {scenario} scenario")
        print(f"{'='*60}")
        
        # Create simulation engine
        engine = SimulationEngine()
        engine.set_mode(mode)
        
        # Set network conditions
        conditions = ScenarioEmulator.get_scenario(scenario)
        engine.update_network_conditions(conditions)
        
        # Start simulation
        await engine.start()
        
        # Send packets with different priorities
        priorities = [
            PacketPriority.CRITICAL,
            PacketPriority.REALTIME,
            PacketPriority.BULK,
            PacketPriority.OPTIONAL
        ]
        
        start_time = time.time()
        packet_seq = 0
        
        # Send packets over duration
        while time.time() - start_time < duration:
            for priority in priorities:
                payload = f"Benchmark packet {packet_seq}".encode('utf-8')
                await engine.send_data(payload, priority, packet_seq)
                packet_seq += 1
            
            await asyncio.sleep(0.1)  # 10 packets/sec
        
        # Wait for packets to be processed
        await asyncio.sleep(2)
        
        # Get metrics
        metrics = engine.get_metrics()
        
        # Stop simulation
        await engine.stop()
        
        # Compile results
        result = {
            "mode": mode.value,
            "scenario": scenario,
            "timestamp": time.time(),
            "duration": duration,
            "packet_count": packet_seq,
            "metrics": {
                "delivery_ratio": metrics["session"]["delivery_ratio"],
                "loss_rate": metrics["session"]["loss_rate"],
                "avg_latency": metrics["session"]["avg_latency"],
                "jitter": metrics["session"]["jitter"],
                "throughput_mbps": metrics["session"]["throughput_mbps"],
                "efficiency_score": metrics["session"]["efficiency_score"],
                "tcp_utilization": metrics["session"]["tcp_utilization"],
                "udp_utilization": metrics["session"]["udp_utilization"],
                "retransmissions": metrics["retransmission"]["retransmissions"],
                "packets_reordered": metrics["reassembly"]["packets_reordered"]
            }
        }
        
        self.results.append(result)
        
        print(f"\nResults:")
        print(f"  Delivery Ratio: {result['metrics']['delivery_ratio']:.2f}%")
        print(f"  Avg Latency: {result['metrics']['avg_latency']*1000:.2f}ms")
        print(f"  Throughput: {result['metrics']['throughput_mbps']:.2f} Mbps")
        print(f"  Efficiency Score: {result['metrics']['efficiency_score']:.2f}/100")
        
        return result
    
    async def run_full_benchmark(self):
        """Run comprehensive benchmark suite."""
        modes = [Protocol.TCP, Protocol.UDP, Protocol.HYBRID]
        scenarios = ["good", "moderate", "poor", "terrible"]
        
        print("\n" + "="*60)
        print("STARTING COMPREHENSIVE BENCHMARK SUITE")
        print("="*60)
        
        for mode in modes:
            for scenario in scenarios:
                try:
                    await self.run_benchmark(mode, scenario, duration=20)
                except Exception as e:
                    print(f"Error in benchmark {mode.value}/{scenario}: {e}")
        
        # Save results
        self.save_results()
        
        # Generate comparison report
        self.generate_comparison_report()
    
    def save_results(self):
        """Save benchmark results to JSON."""
        timestamp = int(time.time())
        filename = self.output_dir / f"benchmark_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nResults saved to: {filename}")
    
    def generate_comparison_report(self):
        """Generate comparison report."""
        if not self.results:
            return
        
        print("\n" + "="*60)
        print("BENCHMARK COMPARISON REPORT")
        print("="*60)
        
        # Group by scenario
        scenarios = {}
        for result in self.results:
            scenario = result["scenario"]
            if scenario not in scenarios:
                scenarios[scenario] = []
            scenarios[scenario].append(result)
        
        # Compare modes for each scenario
        for scenario, results in scenarios.items():
            print(f"\n{scenario.upper()} Network Conditions:")
            print("-" * 60)
            
            for result in results:
                mode = result["mode"]
                metrics = result["metrics"]
                
                print(f"\n  {mode}:")
                print(f"    Delivery Ratio:    {metrics['delivery_ratio']:6.2f}%")
                print(f"    Avg Latency:       {metrics['avg_latency']*1000:6.2f}ms")
                print(f"    Throughput:        {metrics['throughput_mbps']:6.2f} Mbps")
                print(f"    Efficiency Score:  {metrics['efficiency_score']:6.2f}/100")
                print(f"    Retransmissions:   {metrics['retransmissions']:6d}")
        
        # Overall winner
        print("\n" + "="*60)
        print("OVERALL PERFORMANCE")
        print("="*60)
        
        mode_scores = {}
        for result in self.results:
            mode = result["mode"]
            if mode not in mode_scores:
                mode_scores[mode] = []
            mode_scores[mode].append(result["metrics"]["efficiency_score"])
        
        for mode, scores in mode_scores.items():
            avg_score = sum(scores) / len(scores)
            print(f"{mode:8s}: {avg_score:.2f}/100 (avg efficiency)")
        
        best_mode = max(mode_scores.items(), key=lambda x: sum(x[1])/len(x[1]))
        print(f"\nBest Overall: {best_mode[0]}")


async def main():
    """Main benchmark entry point."""
    runner = BenchmarkRunner()
    await runner.run_full_benchmark()


if __name__ == "__main__":
    asyncio.run(main())
