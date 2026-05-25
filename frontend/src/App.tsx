import { useState, useEffect } from 'react';
import { Network, Activity, Zap, TrendingUp, Timer, BarChart3, AlertTriangle, CheckCircle, Gauge } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './services/api';
import { HeroSection } from './components/HeroSection';
import { NetworkTopology } from './components/NetworkTopology';
import { TelemetryLog } from './components/TelemetryLog';
import { MetricsCard } from './components/MetricsCard';
import { LatencyChart } from './components/LatencyChart';
import { ProtocolPieChart } from './components/ProtocolPieChart';
import { ThroughputChart } from './components/ThroughputChart';
import { ControlPanel } from './components/ControlPanel';
import { GeminiBackground } from './components/GeminiBackground';
import { Metrics } from './types';

interface PacketEvent {
  id: string;
  protocol: string;
  type: 'sent' | 'received' | 'dropped' | 'retransmitted';
  timestamp: number;
}

interface RawEvent {
  type: string;
  timestamp: number;
  data: any;
}

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [latencyData, setLatencyData] = useState<Array<{ time: number; latency: number; protocol: string }>>([]);
  const [throughputData, setThroughputData] = useState<Array<{ time: number; throughput: number }>>([]);
  const [packetEvents, setPacketEvents] = useState<PacketEvent[]>([]);
  const [telemetryEvents, setTelemetryEvents] = useState<RawEvent[]>([]);
  const [mode, setMode] = useState('HYBRID');

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
    ws.on('packet_sent', (data) => {
      setPacketEvents((prev) => [
        ...prev.slice(-100),
        {
          id: data.packet_id,
          protocol: data.protocol,
          type: 'sent',
          timestamp: Date.now(),
        },
      ]);
      setTelemetryEvents((prev) => [
        ...prev.slice(-50),
        { type: 'packet_sent', timestamp: Date.now() / 1000, data },
      ]);
    });

    ws.on('packet_received', (data) => {
      const now = Date.now() / 1000;
      setLatencyData((prev) => [
        ...prev.slice(-100),
        { time: now, latency: data.latency * 1000, protocol: data.protocol },
      ]);
      setPacketEvents((prev) => [
        ...prev.slice(-100),
        {
          id: data.packet_id,
          protocol: data.protocol,
          type: 'received',
          timestamp: Date.now(),
        },
      ]);
      setTelemetryEvents((prev) => [
        ...prev.slice(-50),
        { type: 'packet_received', timestamp: now, data },
      ]);
    });

    ws.on('packet_dropped', (data) => {
      setPacketEvents((prev) => [
        ...prev.slice(-100),
        {
          id: data.packet_id,
          protocol: 'UDP',
          type: 'dropped',
          timestamp: Date.now(),
        },
      ]);
      setTelemetryEvents((prev) => [
        ...prev.slice(-50),
        { type: 'packet_dropped', timestamp: Date.now() / 1000, data },
      ]);
    });

    ws.on('packet_retransmitted', (data) => {
      setPacketEvents((prev) => [
        ...prev.slice(-100),
        {
          id: data.packet_id,
          protocol: 'TCP',
          type: 'retransmitted',
          timestamp: Date.now(),
        },
      ]);
      setTelemetryEvents((prev) => [
        ...prev.slice(-50),
        { type: 'packet_retransmitted', timestamp: Date.now() / 1000, data },
      ]);
    });

    ws.on('simulation_started', () => {
      setIsRunning(true);
    });

    ws.on('simulation_stopped', () => {
      setIsRunning(false);
    });

    return () => {
      ws.off('packet_sent');
      ws.off('packet_received');
      ws.off('packet_dropped');
      ws.off('packet_retransmitted');
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
      if (status.mode) setMode(status.mode);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  return (
    <>
      <GeminiBackground />
      <div className="min-h-screen bg-transparent text-text-primary font-sans relative z-10">
        {/* Header */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="max-w-[1600px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow-primary/30">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-text-primary">
                  HyPath
                </h1>
                <p className="text-[11px] text-text-muted font-medium -mt-0.5">
                  Hybrid Transport Protocol Simulator
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* WebSocket Status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 ${
                  ws.isConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-red-50 border-red-200 text-red-500'
                }`}
              >
                <div className={`w-2 h-2 rounded-full relative ${ws.isConnected ? 'bg-emerald-500 status-dot-online' : 'bg-red-400 status-dot-offline'}`} />
                <span>{ws.isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              {/* Simulation Status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isRunning
                    ? 'bg-primary-light border-primary/20 text-primary'
                    : 'bg-slate-50 border-slate-200 text-text-muted'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse' : ''}`} />
                <span>{isRunning ? 'Simulation Running' : 'Idle'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Hero Section */}
        <HeroSection />

        {/* Key Metrics Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up-delay-1">
          <MetricsCard
            title="Packets Sent"
            value={metrics?.session?.packets_sent || 0}
            icon={<Zap className="w-5 h-5" />}
            color="blue"
          />
          <MetricsCard
            title="Packets Received"
            value={metrics?.session?.packets_received || 0}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <MetricsCard
            title="Delivery Ratio"
            value={`${metrics?.session?.delivery_ratio?.toFixed(1) || 0}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
          <MetricsCard
            title="Avg Latency"
            value={`${((metrics?.session?.avg_latency ?? 0) * 1000).toFixed(1)} ms`}
            icon={<Timer className="w-5 h-5" />}
            color="yellow"
          />
        </section>

        {/* Additional Metrics Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up-delay-2">
          <MetricsCard
            title="Throughput"
            value={`${metrics?.session?.throughput_mbps?.toFixed(2) || 0} Mbps`}
            icon={<Gauge className="w-5 h-5" />}
            color="blue"
          />
          <MetricsCard
            title="Loss Rate"
            value={`${metrics?.session?.loss_rate?.toFixed(2) || 0}%`}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
          <MetricsCard
            title="Retransmissions"
            value={metrics?.retransmission?.retransmissions || 0}
            icon={<BarChart3 className="w-5 h-5" />}
            color="yellow"
          />
          <MetricsCard
            title="Efficiency Score"
            value={`${metrics?.session?.efficiency_score?.toFixed(1) || 0}/100`}
            icon={<Activity className="w-5 h-5" />}
            color="green"
          />
        </section>

        {/* Topology + Controls */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-slide-up-delay-3">
          {/* Network Topology — 9 cols */}
          <div className="xl:col-span-9 h-full">
            <NetworkTopology
              isRunning={isRunning}
              mode={mode}
              packetEvents={packetEvents}
              tcpScore={metrics?.scheduler?.tcp_score ?? 50}
              udpScore={metrics?.scheduler?.udp_score ?? 50}
            />
          </div>

          {/* Control Panel — 3 cols */}
          <div className="xl:col-span-3 h-full">
            <ControlPanel isRunning={isRunning} onStatusChange={checkStatus} />
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LatencyChart data={latencyData} />
          <ProtocolPieChart
            tcpPackets={metrics?.scheduler?.tcp_packets || 0}
            udpPackets={metrics?.scheduler?.udp_packets || 0}
          />
        </section>

        {/* Throughput + Telemetry Log */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThroughputChart data={throughputData} />
          <TelemetryLog events={telemetryEvents} />
        </section>

        {/* Path Scores */}
        {metrics && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TCP Path Score */}
            <div className="glass-card-static p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-tcp flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-tcp" />
                TCP Path Score
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2.5 bg-surface-dim rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-tcp to-sky-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${metrics.scheduler.tcp_score}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-tcp font-mono tabular-nums">
                  {metrics.scheduler.tcp_score.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-3 font-medium">
                Utilization: <span className="text-text-primary font-semibold">{metrics.scheduler.tcp_percentage.toFixed(1)}%</span> of traffic
              </p>
            </div>

            {/* UDP Path Score */}
            <div className="glass-card-static p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-udp flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-udp" />
                UDP Path Score
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2.5 bg-surface-dim rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-udp to-violet-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${metrics.scheduler.udp_score}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-udp font-mono tabular-nums">
                  {metrics.scheduler.udp_score.toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-3 font-medium">
                Utilization: <span className="text-text-primary font-semibold">{metrics.scheduler.udp_percentage.toFixed(1)}%</span> of traffic
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-6 py-8 border-t border-border-subtle mt-8">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>HyPath — Hybrid Multi-Path Transport Protocol Simulator</span>
          <span>TCP + UDP Adaptive Routing • Real-time Telemetry</span>
        </div>
      </footer>
    </div>
    </>
  );
}

export default App;
