import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  ShieldCheck, Download, RefreshCw, FlaskConical, AlertCircle,
  CheckCircle2, XCircle, Minus, Activity, Play, Terminal
} from 'lucide-react';
import { api } from '../services/api';
import { Metrics } from '../types';

interface ValidationRow {
  scenario: string;
  mode: string;
  delivery_ratio: number;
  avg_latency_ms: number;
  retransmissions: number;
  tcp_packets: number;
  udp_packets: number;
  bandwidth_mbps: number;
  channel_latency_ms: number;
  channel_loss_pct: number;
}

interface ValidationData {
  methodology: string;
  packet_count: number;
  results: ValidationRow[];
}

interface Props {
  liveMetrics: Metrics | null;
  isRunning: boolean;
  mode: string;
}

const MODE_COLORS: Record<string, string> = {
  TCP: '#0ea5e9', UDP: '#8b5cf6', HYBRID: '#10b981',
};
const BADGE: Record<string, string> = {
  TCP: 'bg-sky-100 text-sky-700 border-sky-200',
  UDP: 'bg-violet-100 text-violet-700 border-violet-200',
  HYBRID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function buildChartData(results: ValidationRow[], metric: 'delivery_ratio' | 'avg_latency_ms') {
  const map = new Map<string, Record<string, number>>();
  for (const r of results) {
    if (!map.has(r.scenario)) map.set(r.scenario, {});
    map.get(r.scenario)![r.mode] = r[metric];
  }
  return Array.from(map.entries()).map(([scenario, vals]) => ({ scenario, ...vals }));
}

// Determine verdict comparing live value vs reference range
function verdict(live: number, ref: number, higherIsBetter: boolean) {
  const delta = higherIsBetter ? live - ref : ref - live;
  if (delta >= -2) return 'pass';
  if (delta >= -8) return 'warn';
  return 'fail';
}

const PAGE_SIZE = 9;

export const ValidationDashboard: React.FC<Props> = ({ liveMetrics, isRunning, mode }) => {
  const [data, setData] = useState<ValidationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [isNs3Running, setIsNs3Running] = useState(false);
  const [ns3Logs, setNs3Logs] = useState<string | null>(null);
  const [ns3Results, setNs3Results] = useState<{
    delivery_ratio: number;
    packets_sent: number;
    packets_received: number;
    retransmissions: number;
    protocol_split: string;
  } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [ns3Scenario, setNs3Scenario] = useState('Moderate');
  const [ns3TcpPackets, setNs3TcpPackets] = useState(50);
  const [ns3UdpPackets, setNs3UdpPackets] = useState(150);
  const load = async () => {
    setLoading(true); setError(null);
    try { setData(await api.getValidation()); }
    catch { setError('Failed to fetch validation data from backend.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Find active scenario from live metrics loss rate, default to 'Moderate'
  const activeScenario = liveMetrics?.conditions
    ? (() => {
        const loss = liveMetrics.conditions.packet_loss_rate;
        if (loss === 0) return 'Ideal';
        if (loss === 0.001) return 'Good';
        if (loss === 0.02) return 'Moderate';
        if (loss === 0.05) return 'Poor';
        if (loss === 0.15) return 'Terrible';
        if (loss === 0.03) return 'Drone Telemetry';
        if (loss === 0.01) return 'Live Streaming';
        if (loss === 0.04) return 'Industrial IoT';
        if (loss === 0.10) return 'Disaster Response';
        return 'Moderate';
      })()
    : 'Moderate';

  useEffect(() => {
    if (activeScenario) {
      setNs3Scenario(activeScenario);
    }
  }, [activeScenario]);

  useEffect(() => {
    setNs3Results(null);
    setNs3Logs(null);
  }, [ns3Scenario]);

  // Find ns-3 reference row matching current live mode and active scenario
  const refRow = data?.results.find(r =>
    r.mode === (mode === 'HYBRID' ? 'HYBRID' : mode) &&
    r.scenario.toLowerCase() === activeScenario.toLowerCase()
  ) ?? null;

  const liveDelivery = liveMetrics
    ? (liveMetrics.session.packets_sent > 0
      ? (liveMetrics.session.packets_received / liveMetrics.session.packets_sent) * 100
      : null)
    : null;
  const liveLatency = liveMetrics
    ? liveMetrics.session.avg_latency * 1000
    : null;
  const liveRetx = liveMetrics?.retransmission.retransmissions ?? null;

  const checks = refRow && liveDelivery !== null ? (() => {
    // Normalize retransmissions to per-200-packet basis (same as ns-3 reference run)
    const normalizedRetx = liveMetrics && liveMetrics.session.packets_sent > 0
      ? (liveRetx ?? 0) / liveMetrics.session.packets_sent * 200
      : (liveRetx ?? 0);

    const isCppVerified = ns3Results !== null;
    const refDelivery = isCppVerified ? ns3Results.delivery_ratio : refRow.delivery_ratio;
    const refRetransmissions = isCppVerified
      ? (ns3Results.packets_sent > 0
          ? (ns3Results.retransmissions / ns3Results.packets_sent) * 200
          : 0)
      : refRow.retransmissions;

    return [
      {
        label: 'Delivery Ratio',
        live: `${liveDelivery.toFixed(1)}%`,
        ref: `${refDelivery.toFixed(1)}%`,
        status: verdict(liveDelivery, refDelivery, true),
        desc: isCppVerified
          ? `Live vs Real ns-3 C++ run (${activeScenario})`
          : `Live vs ns-3 ${activeScenario} baseline`,
        comparable: true,
        isCppVerified,
      },
      {
        label: 'Retx / 200 pkts',
        live: normalizedRetx.toFixed(1),
        ref: isCppVerified ? refRetransmissions.toFixed(1) : `~${refRetransmissions}`,
        status: normalizedRetx <= refRetransmissions + 3
          ? 'pass' : normalizedRetx <= refRetransmissions + 10
          ? 'warn' : 'fail',
        desc: 'Normalized to 200-pkt run to match ns-3 scale',
        comparable: true,
        isCppVerified,
      },
      {
        label: 'Avg Latency',
        live: liveLatency !== null ? `${liveLatency.toFixed(1)} ms` : 'N/A',
        ref: `${refRow.avg_latency_ms} ms`,
        status: 'info' as const,
        desc: 'Live = sim queue + pacing; ns-3 = channel propagation only',
        comparable: false,
        isCppVerified: false,
      },
    ];
  })() : null;

  const handleRunNs3 = async () => {
    setIsNs3Running(true);
    setRunError(null);
    setNs3Logs(null);
    setNs3Results(null);
    setShowLogs(true);
    try {
      const res = await api.runNs3Simulation('/Users/gurudev/ns-allinone-3.35/ns-3.35', ns3Scenario, ns3TcpPackets, ns3UdpPackets);
      if (res.success) {
        setNs3Results(res);
        setNs3Logs(res.logs);
      } else {
        setRunError(res.error || 'ns-3 execution failed.');
        setNs3Logs(res.logs || 'No logs returned.');
      }
    } catch (err) {
      setRunError('Failed to run ns-3 simulation.');
      setNs3Logs(err instanceof Error ? err.message : 'Unknown network error');
    } finally {
      setIsNs3Running(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-text-muted">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Running validation model…
    </div>
  );
  if (error) return (
    <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600">
      <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
    </div>
  );
  if (!data) return null;

  const deliveryChart = buildChartData(data.results, 'delivery_ratio');
  const latencyChart  = buildChartData(data.results, 'avg_latency_ms');
  const visibleRows   = data.results.slice(0, page * PAGE_SIZE);
  const hasMore       = visibleRows.length < data.results.length;

  return (
    <div className="space-y-5">

      {/* ── Live Verification Panel ── */}
      <div className="glass-card-static p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">
                Live Simulation vs ns-3 Reference
              </h2>
              <p className="text-[11px] text-text-muted">
                Compares your running simulation against the {activeScenario} scenario ns-3 baseline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isRunning
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-slate-100 border-slate-200 text-text-muted'
            }`}>
              <Activity className={`w-3 h-3 ${isRunning ? 'animate-pulse' : ''}`} />
              {isRunning ? 'Live Data Active' : 'Run a simulation to get live data'}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${BADGE[mode] ?? BADGE['HYBRID']}`}>
              {mode}
            </span>
          </div>
        </div>

        {/* --- ns-3 Integration Controls --- */}
        <div className="mb-4 p-4 border border-border-subtle/50 bg-slate-50/40 rounded-2xl">
          <div className="flex flex-col gap-4">
            {/* Header + Actions Row */}
            <div className="flex items-center justify-between gap-4 border-b border-border-subtle/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[11px] font-bold tracking-tight text-text-secondary">
                  ns-3 C++ Simulation Verification Engine
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunNs3}
                  disabled={isNs3Running}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isNs3Running
                      ? 'bg-primary text-white hover:opacity-95 shadow-glow-primary/20'
                      : 'bg-slate-200 border border-slate-300 text-text-muted cursor-not-allowed'
                  }`}
                >
                  {isNs3Running ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  {isNs3Running ? 'Executing...' : 'Run Real ns-3 Simulation'}
                </button>

                {ns3Logs && (
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-subtle bg-white/60 text-xs font-semibold text-text-secondary hover:bg-white transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    {showLogs ? 'Hide Logs' : 'Show Logs'}
                  </button>
                )}
              </div>
            </div>

            {/* Customization Inputs Row */}
            <div className="flex flex-wrap items-center gap-5 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold tracking-wider text-text-muted uppercase">Scenario:</label>
                <select
                  value={ns3Scenario}
                  onChange={(e) => setNs3Scenario(e.target.value)}
                  disabled={isNs3Running}
                  className="bg-white/80 border border-border-subtle/80 rounded-lg px-2.5 py-1 text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  {['Ideal', 'Good', 'Moderate', 'Poor', 'Terrible', 'Drone Telemetry', 'Live Streaming', 'Industrial IoT', 'Disaster Response'].map((sc) => (
                    <option key={sc} value={sc}>{sc}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold tracking-wider text-text-muted uppercase">TCP Packets:</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={ns3TcpPackets}
                  onChange={(e) => setNs3TcpPackets(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={isNs3Running}
                  className="w-16 bg-white/80 border border-border-subtle/80 rounded-lg px-2 py-1 text-xs text-center font-bold font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold tracking-wider text-text-muted uppercase">UDP Packets:</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={ns3UdpPackets}
                  onChange={(e) => setNs3UdpPackets(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={isNs3Running}
                  className="w-16 bg-white/80 border border-border-subtle/80 rounded-lg px-2 py-1 text-xs text-center font-bold font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />
              </div>

              <div className="text-[10px] text-text-muted font-medium ml-auto">
                Total packets: <strong className="text-text-primary font-mono">{ns3TcpPackets + ns3UdpPackets}</strong>
              </div>
            </div>
          </div>

          {/* Collapsible terminal console */}
          {showLogs && ns3Logs && (
            <div className="mt-3 border border-slate-800 bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
                <span className="text-[10px] font-bold font-mono tracking-wide text-slate-400">
                  ns-3 Compilation & Simulation Console
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isNs3Running ? 'bg-yellow-500/20 text-yellow-400' :
                  runError ? 'bg-red-500/20 text-red-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isNs3Running ? 'RUNNING' : runError ? 'ERROR' : 'COMPLETED'}
                </span>
              </div>
              <pre className="p-3 text-[10px] font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap select-text selection:bg-primary/30">
                {ns3Logs}
              </pre>
            </div>
          )}
        </div>

        {!isRunning || !checks ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-text-muted">
            <Minus className="w-4 h-4 flex-shrink-0" />
            Start a simulation on the <strong className="text-text-primary mx-1">Simulator</strong> tab to see live verification against ns-3 reference data.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {checks.map(({ label, live, ref, status, desc, isCppVerified }) => (
              <div
                key={label}
                className={`p-3 rounded-xl border relative ${
                  status === 'pass' ? 'bg-emerald-50/60 border-emerald-200' :
                  status === 'warn' ? 'bg-yellow-50/60 border-yellow-200' :
                  status === 'fail' ? 'bg-red-50/60 border-red-200' :
                                     'bg-slate-50/60 border-slate-200'
                }`}
              >
                {isCppVerified && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-bold text-white bg-indigo-500 rounded-md shadow-sm border border-indigo-400 animate-pulse">
                    C++ ns-3
                  </span>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
                  {status === 'pass' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> :
                   status === 'warn' ? <AlertCircle  className="w-3.5 h-3.5 text-yellow-500" /> :
                   status === 'fail' ? <XCircle      className="w-3.5 h-3.5 text-red-500" /> :
                                      <Minus        className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-text-muted font-medium mb-0.5">Live</p>
                    <p className="text-lg font-bold font-mono text-text-primary leading-tight">{live}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted font-medium mb-0.5">{isCppVerified ? 'ns-3 C++' : 'ns-3 ref'}</p>
                    <p className="text-lg font-bold font-mono text-text-secondary leading-tight">{ref}</p>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted mt-1.5">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Charts + Actions Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="glass-card-static p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-3">
            Delivery Ratio by Scenario (%)
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deliveryChart} margin={{ top: 0, right: 4, left: -22, bottom: 52 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="scenario" tick={{ fontSize: 8, fill: '#94a3b8' }} angle={-38} textAnchor="end" interval={0} />
              <YAxis domain={[80, 101]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 12 }} />
              {['TCP', 'UDP', 'HYBRID'].map(m => (
                <Bar key={m} dataKey={m} fill={MODE_COLORS[m]} radius={[3, 3, 0, 0]} maxBarSize={14} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-static p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-3">
            Avg Latency by Scenario (ms)
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={latencyChart} margin={{ top: 0, right: 4, left: -10, bottom: 52 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="scenario" tick={{ fontSize: 8, fill: '#94a3b8' }} angle={-38} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v: number) => [`${v} ms`]} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 12 }} />
              {['TCP', 'UDP', 'HYBRID'].map(m => (
                <Bar key={m} dataKey={m} fill={MODE_COLORS[m]} radius={[3, 3, 0, 0]} maxBarSize={14} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Compact paginated table ── */}
      <div className="glass-card-static p-4 max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            ns-3 Reference Data · {data.packet_count} packets/run
          </p>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-subtle bg-white/60 text-[11px] font-semibold text-text-secondary hover:bg-white transition-all">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
            <button onClick={() => { const a = document.createElement('a'); a.href='/api/metrics/validation'; a.download='ns3_validation.json'; a.click(); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[11px] font-semibold hover:opacity-90 transition-all">
              <Download className="w-3 h-3" /> JSON
            </button>
            <a href="/api/scripts/ns3_compare" download="ns3_compare.py" className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary text-[11px] font-semibold bg-primary/5 hover:bg-primary/10 transition-all">
              <FlaskConical className="w-3 h-3" /> Script
            </a>
          </div>
        </div>

        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-border-subtle">
              {['Scenario', 'Mode', 'Loss', 'Delivery', 'Latency', 'Retx', 'Split'].map(h => (
                <th key={h} className="text-left py-1.5 pr-3 font-semibold text-text-muted uppercase tracking-wider text-[9px] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr key={i} className={`border-b border-border-subtle/40 transition-colors ${
                row.mode === 'HYBRID' ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'
              }`}>
                <td className="py-2 pr-3 font-semibold text-text-primary whitespace-nowrap">{row.scenario}</td>
                <td className="py-2 pr-3">
                  <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${BADGE[row.mode]}`}>
                    {row.mode}
                  </span>
                </td>
                <td className="py-2 pr-3 font-mono text-text-muted">{row.channel_loss_pct}%</td>
                <td className="py-2 pr-3">
                  <span className={`font-bold font-mono ${
                    row.delivery_ratio >= 98 ? 'text-emerald-600' :
                    row.delivery_ratio >= 94 ? 'text-yellow-600' : 'text-red-500'
                  }`}>{row.delivery_ratio}%</span>
                </td>
                <td className="py-2 pr-3 font-mono text-text-muted">{row.avg_latency_ms} ms</td>
                <td className="py-2 pr-3 font-mono text-text-muted">{row.retransmissions}</td>
                <td className="py-2 font-mono text-[10px] whitespace-nowrap">
                  <span className="text-sky-600">{row.tcp_packets}T</span>
                  <span className="text-text-muted">/</span>
                  <span className="text-violet-600">{row.udp_packets}U</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="mt-3 w-full py-2 rounded-xl border border-border-subtle bg-white/60 text-[11px] font-semibold text-text-secondary hover:bg-white transition-all"
          >
            Load more ({data.results.length - visibleRows.length} remaining)
          </button>
        )}
        <p className="mt-2 text-[10px] text-text-muted">
          {data.methodology}
        </p>
      </div>

      {/* ── Takeaways ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { color: 'sky',     title: 'TCP — Reliability at a Cost',  body: '100% delivery via retransmission but latency balloons under high loss due to RTO timeouts.' },
          { color: 'violet',  title: 'UDP — Speed with Trade-offs',   body: 'Latency stays near propagation delay but packet loss is unchecked under degraded links.' },
          { color: 'emerald', title: 'Hybrid — Best of Both',         body: 'Routes critical/degraded via TCP, real-time via UDP. Achieves 95–98% delivery with lower latency than pure TCP.' },
        ].map(({ color, title, body }) => (
          <div key={title} className={`glass-card-static p-4 bg-${color}-50/40 border-${color}-200/60`}>
            <p className={`text-[11px] font-bold text-${color}-700 mb-1`}>{title}</p>
            <p className="text-[11px] text-text-secondary leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
