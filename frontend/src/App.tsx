import { useState, useEffect } from 'react';
import { Activity, Network, Zap, TrendingUp } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './services/api';
import { MetricsCard } from './components/MetricsCard';
import { LatencyChart } from './components/LatencyChart';
import { ProtocolPieChart } from './components/ProtocolPieChart';
import { ThroughputChart } from './components/ThroughputChart';
import { ControlPanel } from './components/ControlPanel';
import { Metrics } from './types';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [latencyData, setLatencyData] = useState<Array<{ time: number; latency: number; protocol: string }>>([]);
  const [throughputData, setThroughputData] = useState<Array<{ time: number; throughput: number }>>([]);
  
  const ws = useWebSocket('ws://localhost:3000/ws');

  // Fetch status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  // Fetch metrics periodically
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const data = await api.getMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle WebSocket events
  useEffect(() => {
    ws.on('packet_received', (data) => {
      const now = Date.now() / 1000;
      setLatencyData((prev) => [
        ...prev.slice(-100),
        { time: now, latency: data.latency * 1000, protocol: data.protocol },
      ]);
    });

    ws.on('simulation_started', () => {
      setIsRunning(true);
    });

    ws.on('simulation_stopped', () => {
      setIsRunning(false);
    });

    return () => {
      ws.off('packet_received');
      ws.off('simulation_started');
      ws.off('simulation_stopped');
    };
  }, [ws]);

  // Update throughput data
  useEffect(() => {
    if (metrics?.session) {
      const now = Date.now() / 1000;
      setThroughputData((prev) => [
        ...prev.slice(-100),
        { time: now, throughput: metrics.session.throughput_mbps },
      ]);
    }
  }, [metrics]);

  const checkStatus = async () => {
    try {
      const status = await api.getStatus();
      setIsRunning(status.running);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Network className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold">Hybrid Transport Protocol Simulator</h1>
                <p className="text-sm text-gray-400">TCP + UDP Adaptive Routing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                ws.isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${ws.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm font-medium">
                  {ws.isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                isRunning ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
              }`}>
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <ControlPanel isRunning={isRunning} onStatusChange={checkStatus} />
          </div>

          {/* Metrics and Charts */}
          <div className="lg:col-span-3 space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricsCard
                title="Packets Sent"
                value={metrics?.session?.packets_sent || 0}
                icon={<Zap />}
                color="blue"
              />
              <MetricsCard
                title="Packets Received"
                value={metrics?.session?.packets_received || 0}
                icon={<Activity />}
                color="green"
              />
              <MetricsCard
                title="Delivery Ratio"
                value={`${metrics?.session?.delivery_ratio?.toFixed(1) || 0}%`}
                icon={<TrendingUp />}
                color="purple"
              />
              <MetricsCard
                title="Avg Latency"
                value={`${((metrics?.session?.avg_latency ?? 0) * 1000).toFixed(1)}ms`}
                icon={<Activity />}
                color="yellow"
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricsCard
                title="Throughput"
                value={`${metrics?.session?.throughput_mbps?.toFixed(2) || 0} Mbps`}
                color="blue"
              />
              <MetricsCard
                title="Loss Rate"
                value={`${metrics?.session?.loss_rate?.toFixed(2) || 0}%`}
                color="red"
              />
              <MetricsCard
                title="Retransmissions"
                value={metrics?.retransmission?.retransmissions || 0}
                color="yellow"
              />
              <MetricsCard
                title="Efficiency Score"
                value={`${metrics?.session?.efficiency_score?.toFixed(1) || 0}/100`}
                color="green"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LatencyChart data={latencyData} />
              <ProtocolPieChart
                tcpPackets={metrics?.scheduler?.tcp_packets || 0}
                udpPackets={metrics?.scheduler?.udp_packets || 0}
              />
            </div>

            <ThroughputChart data={throughputData} />

            {/* Path Scores */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">TCP Path Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${metrics.scheduler.tcp_score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-blue-400">
                      {metrics.scheduler.tcp_score.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {metrics.scheduler.tcp_percentage.toFixed(1)}% of traffic
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold mb-3 text-green-400">UDP Path Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${metrics.scheduler.udp_score}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-green-400">
                      {metrics.scheduler.udp_score.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {metrics.scheduler.udp_percentage.toFixed(1)}% of traffic
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
