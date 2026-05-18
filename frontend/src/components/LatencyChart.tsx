import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LatencyChartProps {
  data: Array<{ time: number; latency: number; protocol: string }>;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ data }) => {
  // Group data by time and aggregate
  const aggregatedData = data.reduce((acc, item) => {
    const timeKey = Math.floor(item.time);
    if (!acc[timeKey]) {
      acc[timeKey] = { time: timeKey, tcp: [], udp: [] };
    }
    if (item.protocol === 'TCP') {
      acc[timeKey].tcp.push(item.latency);
    } else {
      acc[timeKey].udp.push(item.latency);
    }
    return acc;
  }, {} as Record<number, any>);

  const chartData = Object.values(aggregatedData).map((item: any) => ({
    time: item.time,
    tcp: item.tcp.length > 0 ? item.tcp.reduce((a: number, b: number) => a + b, 0) / item.tcp.length : null,
    udp: item.udp.length > 0 ? item.udp.reduce((a: number, b: number) => a + b, 0) / item.udp.length : null,
  })).slice(-30); // Last 30 data points

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Latency Over Time</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#E5E7EB' }}
          />
          <Legend />
          <Line type="monotone" dataKey="tcp" stroke="#3B82F6" name="TCP" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="udp" stroke="#10B981" name="UDP" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
