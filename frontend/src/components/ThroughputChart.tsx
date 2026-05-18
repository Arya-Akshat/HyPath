import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ThroughputChartProps {
  data: Array<{ time: number; throughput: number }>;
}

export const ThroughputChart: React.FC<ThroughputChartProps> = ({ data }) => {
  const chartData = data.slice(-30); // Last 30 data points

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Throughput</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
            labelStyle={{ color: '#E5E7EB' }}
          />
          <Area
            type="monotone"
            dataKey="throughput"
            stroke="#8B5CF6"
            fillOpacity={1}
            fill="url(#colorThroughput)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
