import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Clock } from 'lucide-react';

interface LatencyChartProps {
  data: Array<{ time: number; latency: number; protocol: string }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border-subtle rounded-xl shadow-lg px-4 py-3 text-text-primary">
      <p className="text-xs font-semibold text-text-muted mb-1.5">
        {label && !isNaN(label)
          ? `Time: ${new Date(label * 1000).toLocaleTimeString()}`
          : ''}
      </p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          <span className="font-medium">{entry.name}:</span>{' '}
          {parseFloat(entry.value).toFixed(1)} ms
        </p>
      ))}
    </div>
  );
};

export const LatencyChart: React.FC<LatencyChartProps> = ({ data }) => {
  // Group data by time and aggregate
  const aggregatedData = data.reduce((acc, item) => {
    const timeKey = Math.floor(item.time);
    if (!acc[timeKey]) {
      acc[timeKey] = { time: timeKey, tcp: [] as number[], udp: [] as number[] };
    }
    if (item.protocol === 'TCP') {
      acc[timeKey].tcp.push(item.latency);
    } else {
      acc[timeKey].udp.push(item.latency);
    }
    return acc;
  }, {} as Record<number, { time: number; tcp: number[]; udp: number[] }>);

  const chartData = Object.values(aggregatedData)
    .map((item) => ({
      time: item.time,
      tcp:
        item.tcp.length > 0
          ? item.tcp.reduce((a, b) => a + b, 0) / item.tcp.length
          : null,
      udp:
        item.udp.length > 0
          ? item.udp.reduce((a, b) => a + b, 0) / item.udp.length
          : null,
    }))
    .slice(-30); // Last 30 data points

  return (
    <div className="glass-card-static p-5">
      <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-tcp" />
        Latency Over Time
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
        >
          <defs>
            <linearGradient id="latencyTcpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="latencyUdpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            tickFormatter={(t) => {
              if (!t || isNaN(t)) return '';
              return new Date(t * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
            }}
            minTickGap={45}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            stroke="#94a3b8"
            tickFormatter={(val) => `${val.toFixed(0)} ms`}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
          />
          <Line
            type="monotone"
            dataKey="tcp"
            stroke="#0ea5e9"
            name="TCP"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="udp"
            stroke="#8b5cf6"
            name="UDP"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
