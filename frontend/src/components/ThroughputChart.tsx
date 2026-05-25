import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ThroughputChartProps {
  data: Array<{ time: number; throughput: number }>;
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
      <p className="text-sm font-medium" style={{ color: '#4f46e5' }}>
        {parseFloat(payload[0].value).toFixed(2)} Mbps
      </p>
    </div>
  );
};

export const ThroughputChart: React.FC<ThroughputChartProps> = ({ data }) => {
  const chartData = data.slice(-30); // Last 30 data points

  return (
    <div className="glass-card-static p-5">
      <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Throughput
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 15, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
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
            tickFormatter={(val) => val === 0 ? '0' : `${val.toFixed(1)} Mbps`}
            allowDecimals={false}
            domain={[0, 'auto']}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={{ stroke: '#e2e8f0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="throughput"
            stroke="#4f46e5"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorThroughput)"
            activeDot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
