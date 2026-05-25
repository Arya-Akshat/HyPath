import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

/* ─── Types ─── */
interface TelemetryLogProps {
  events: Array<{
    id?: string;
    type: string;
    timestamp: number;
    data: any;
  }>;
}

/* ─── Helpers ─── */
const MAX_VISIBLE = 50;

const TYPE_STYLES: Record<string, { label: string; className: string }> = {
  packet_sent:           { label: 'SENT', className: 'bg-primary/15 text-primary border border-primary/20' },
  packet_received:       { label: 'RCVD', className: 'bg-success/15 text-success border border-success/20' },
  packet_dropped:        { label: 'DROP', className: 'bg-danger/15 text-danger border border-danger/20' },
  packet_retransmitted:  { label: 'RTXN', className: 'bg-warning/15 text-warning border border-warning/20' },
  sent:           { label: 'SENT', className: 'bg-primary/15 text-primary border border-primary/20' },
  received:       { label: 'RCVD', className: 'bg-success/15 text-success border border-success/20' },
  dropped:        { label: 'DROP', className: 'bg-danger/15 text-danger border border-danger/20' },
  retransmitted:  { label: 'RTXN', className: 'bg-warning/15 text-warning border border-warning/20' },
};


const PROTOCOL_STYLES: Record<string, string> = {
  TCP: 'bg-tcp-light text-tcp-dark border border-tcp/20',
  UDP: 'bg-udp-light text-udp-dark border border-udp/20',
};

function formatTimestamp(ts: number): string {
  // handle seconds vs milliseconds
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

function describeEvent(evt: { type: string; data: any }): string {
  const proto = evt.data?.protocol ?? '';
  const pktId = evt.data?.packet_id
    ? `#${String(evt.data.packet_id).slice(-6)}`
    : '';
  const size = evt.data?.size ? `${evt.data.size}B` : '';
  const latency = evt.data?.latency != null
    ? `${(evt.data.latency * 1000).toFixed(1)}ms`
    : '';

  const normalizedType = evt.type.replace('packet_', '');

  switch (normalizedType) {
    case 'sent':
      return `Packet ${pktId} dispatched via ${proto} ${size ? `(${size})` : ''}`.trim();
    case 'received':
      return `Packet ${pktId} arrived ${latency ? `in ${latency}` : ''}`.trim();
    case 'dropped':
      return `Packet ${pktId} lost on ${proto} path`.trim();
    case 'retransmitted':
      return `Packet ${pktId} retransmitted via ${proto}`.trim();
    default:
      return `Event: ${evt.type}`;
  }
}

/* ─── Component ─── */
export const TelemetryLog: React.FC<TelemetryLogProps> = ({ events }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new events
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const visibleEvents = events.slice(-MAX_VISIBLE);

  return (
    <div className="glass-card-static overflow-hidden rounded-2xl">
      {/* ─── Title bar ─── */}
      <div className="flex items-center justify-between border-b border-border-glass px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-title text-text-primary">Live Telemetry Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-2.5 w-2.5">
            <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </div>
          <span className="text-label text-success uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* ─── Log body ─── */}
      <div
        ref={scrollRef}
        className="log-scroll overflow-y-auto p-5"
        style={{ maxHeight: 250 }}
      >
        {visibleEvents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-data font-mono text-text-muted animate-pulse-slow">
              Waiting for telemetry data…
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {visibleEvents.map((evt, idx) => {
              const typeStyle =
                TYPE_STYLES[evt.type] ??
                TYPE_STYLES['sent'];
              const protocol: string = evt.data?.protocol ?? '';
              const protoStyle =
                PROTOCOL_STYLES[protocol] ?? '';

              return (
                <div
                  key={evt.id ?? `evt-${idx}`}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-dim/60"
                >
                  {/* Timestamp */}
                  <span className="shrink-0 text-xs font-mono text-text-muted tabular-nums">
                    {formatTimestamp(evt.timestamp)}
                  </span>

                  {/* Event type badge */}
                  <span
                    className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeStyle.className}`}
                  >
                    {typeStyle.label}
                  </span>

                  {/* Protocol badge */}
                  {protocol && protoStyle && (
                    <span
                      className={`shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${protoStyle}`}
                    >
                      {protocol}
                    </span>
                  )}

                  {/* Description */}
                  <span className="truncate text-data font-mono text-text-secondary group-hover:text-text-primary transition-colors">
                    {describeEvent(evt)}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TelemetryLog;
