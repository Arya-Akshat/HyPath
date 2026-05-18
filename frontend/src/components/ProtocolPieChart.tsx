import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProtocolPieChartProps {
  tcpPackets: number;
  udpPackets: number;
}

export const ProtocolPieChart: React.FC<ProtocolPieChartProps> = ({ tcpPackets, udpPackets }) => {
  const data = [
    { name: 'TCP', value: tcpPackets, color: '#3B82F6' },
    { name: 'UDP', value: udpPackets, color: '#10B981' },
  ];

  const total = tcpPackets + udpPackets;

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Protocol Distribution</h3>
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#E5E7EB' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};
