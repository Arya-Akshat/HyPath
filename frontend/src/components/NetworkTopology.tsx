import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Route } from 'lucide-react';

/* ─── Types ─── */
interface NetworkTopologyProps {
  isRunning: boolean;
  mode: string; // 'TCP' | 'UDP' | 'HYBRID'
  packetEvents: Array<{
    id: string;
    protocol: string;
    type: 'sent' | 'received' | 'dropped' | 'retransmitted';
    timestamp: number;
  }>;
  tcpScore: number;
  udpScore: number;
}

interface PacketDot {
  id: string;
  protocol: 'TCP' | 'UDP';
  duration: number;
  createdAt: number;
}

/* ─── Path constants ─── */
const TCP_PATH = 'M150,200 C300,50 700,50 850,200';
const UDP_PATH = 'M150,200 C300,350 700,350 850,200';

/* ─── Component ─── */
export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  isRunning,
  mode,
  packetEvents,
  tcpScore,
  udpScore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [packets, setPackets] = useState<PacketDot[]>([]);
  const nextIdRef = useRef(0);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);

  /* ─── Mouse tracking ─── */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setMousePos(null), []);

  /* ─── Spawn packets from real data ─── */
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isRunning) {
      setPackets([]);
      processedIds.current.clear();
      return;
    }

    const newPackets: PacketDot[] = [];
    packetEvents.forEach((e) => {
      if (e.type === 'sent' && !processedIds.current.has(e.id)) {
        processedIds.current.add(e.id);
        newPackets.push({
          id: e.id,
          protocol: e.protocol as 'TCP' | 'UDP',
          duration: e.protocol === 'TCP' ? 2 : 1.2, // Flight animation duration
          createdAt: Date.now(),
        });
      }
    });

    if (newPackets.length > 0) {
      setPackets((prev) => [...prev, ...newPackets]);
    }

    // Keep memory bounded
    if (processedIds.current.size > 500) {
      const activeSet = new Set<string>();
      packetEvents.forEach(e => activeSet.add(e.id));
      processedIds.current = activeSet;
    }
  }, [packetEvents, isRunning]);

  /* ─── Garbage collect finished packets ─── */
  useEffect(() => {
    const gc = setInterval(() => {
      const now = Date.now();
      setPackets((prev) =>
        prev.filter((p) => now - p.createdAt < p.duration * 1000 + 500)
      );
    }, 2000);
    return () => clearInterval(gc);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-card-static dot-grid relative overflow-hidden rounded-2xl h-full flex flex-col"
    >
      {/* Mouse-tracking radial gradient overlay */}
      {mousePos && (
        <div
          className="pointer-events-none absolute z-10 transition-opacity duration-300"
          style={{
            width: 400,
            height: 400,
            left: mousePos.x - 200,
            top: mousePos.y - 200,
            background:
              'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
      )}

      {/* ─── Top bar ─── */}
      <div className="relative z-20 flex items-center justify-between border-b border-border-glass px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Route className="h-4 w-4 text-primary" />
          <span className="text-title text-text-primary">Live Network Topology</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-tcp-light px-3 py-1 text-label text-tcp-dark">
            <span className="inline-block h-2 w-2 rounded-full bg-tcp" />
            TCP Lane
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-udp-light px-3 py-1 text-label text-udp-dark">
            <span className="inline-block h-2 w-2 rounded-full bg-udp" />
            UDP Lane
          </span>
        </div>
      </div>

      {/* ─── SVG Topology ─── */}
      <div className="relative z-20 px-4 py-6">
        <svg
          viewBox="0 0 1000 400"
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow filters */}
            <filter id="glow-tcp" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-udp" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* ─ TCP path ─ */}
          <path
            d={TCP_PATH}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="2"
            strokeDasharray="8 6"
            opacity="0.5"
          />
          {/* TCP path label */}
          <text x="500" y="65" textAnchor="middle" fill="#0ea5e9" fontSize="11" fontFamily="Inter" fontWeight="600" opacity="0.7">
            TCP PATH
          </text>

          {/* ─ UDP path ─ */}
          <path
            d={UDP_PATH}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="8 6"
            opacity="0.5"
          />
          {/* UDP path label */}
          <text x="500" y="355" textAnchor="middle" fill="#8b5cf6" fontSize="11" fontFamily="Inter" fontWeight="600" opacity="0.7">
            UDP PATH
          </text>

          {/* ─ SOURCE node ─ */}
          <g filter="url(#node-shadow)">
            {/* Pulsing ring */}
            <circle cx="150" cy="200" r="38" fill="none" stroke="#4f46e5" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values="38;48;38" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="150" cy="200" r="36" fill="white" stroke="#4f46e5" strokeWidth="2.5" />
            <text
              x="150"
              y="196"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#4f46e5"
              fontSize="11"
              fontFamily="Inter"
              fontWeight="700"
              letterSpacing="0.08em"
            >
              SOURCE
            </text>
            <text
              x="150"
              y="212"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize="9"
              fontFamily="JetBrains Mono"
            >
              10.0.0.1
            </text>
          </g>

          {/* ─ DEST node ─ */}
          <g filter="url(#node-shadow)">
            {/* Pulsing ring */}
            <circle cx="850" cy="200" r="38" fill="none" stroke="#58579b" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values="38;48;38" dur="3s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </circle>
            <circle cx="850" cy="200" r="36" fill="white" stroke="#58579b" strokeWidth="2.5" />
            <text
              x="850"
              y="196"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#58579b"
              fontSize="11"
              fontFamily="Inter"
              fontWeight="700"
              letterSpacing="0.08em"
            >
              DEST
            </text>
            <text
              x="850"
              y="212"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize="9"
              fontFamily="JetBrains Mono"
            >
              10.0.0.2
            </text>
          </g>

          {/* ─ Score badges ─ */}
          <g>
            <rect x="430" y="80" width="60" height="24" rx="12" fill="#e0f2fe" />
            <text x="460" y="92" textAnchor="middle" dominantBaseline="middle" fill="#0284c7" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
              {tcpScore.toFixed(0)}%
            </text>
          </g>
          <g>
            <rect x="430" y="296" width="60" height="24" rx="12" fill="#ede9fe" />
            <text x="460" y="308" textAnchor="middle" dominantBaseline="middle" fill="#7c3aed" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
              {udpScore.toFixed(0)}%
            </text>
          </g>

          {/* ─ Animated packet dots ─ */}
          {packets.map((pkt) => (
            <circle
              key={pkt.id}
              r="5"
              fill={pkt.protocol === 'TCP' ? '#0ea5e9' : '#8b5cf6'}
              filter={pkt.protocol === 'TCP' ? 'url(#glow-tcp)' : 'url(#glow-udp)'}
              className="packet-dot"
              style={
                {
                  '--packet-path': `"${pkt.protocol === 'TCP' ? TCP_PATH : UDP_PATH}"`,
                  '--packet-duration': `${pkt.duration}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </svg>
      </div>

      {/* ─── Bottom-left glass stats panel ─── */}
      <div className="absolute bottom-4 left-4 z-30 rounded-xl border border-border-glass bg-white/80 backdrop-blur-lg px-4 py-3 shadow-glass">
        <p className="text-label text-text-muted mb-1.5 uppercase tracking-widest">Node Stats</p>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-data font-mono text-text-muted">CPU</span>
            <span className="text-data font-mono font-semibold text-text-primary">12%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-data font-mono text-text-muted">MEM</span>
            <span className="text-data font-mono font-semibold text-text-primary">4.2 GB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-data font-mono text-text-muted">PKT/s</span>
            <span className="text-data font-mono font-semibold text-text-primary">
              {isRunning ? packetEvents.length : 0}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Bottom-right mode badge ─── */}
      <div className="absolute bottom-4 right-4 z-30 rounded-full border border-border-glass bg-white/80 backdrop-blur-lg px-4 py-2 shadow-glass">
        <span className="text-label text-text-muted mr-2">MODE</span>
        <span className={`text-label font-bold ${
          mode === 'TCP'
            ? 'text-tcp'
            : mode === 'UDP'
            ? 'text-udp'
            : 'text-primary'
        }`}>
          {mode}
        </span>
      </div>
    </div>
  );
};

export default NetworkTopology;
