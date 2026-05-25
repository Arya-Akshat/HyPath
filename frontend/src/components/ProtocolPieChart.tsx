import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ProtocolPieChartProps {
  tcpPackets: number;
  udpPackets: number;
}

const COLORS = {
  TCP: '#0ea5e9',
  UDP: '#8b5cf6',
} as const;

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-border-subtle rounded-xl shadow-lg px-4 py-3 text-text-primary">
      <p className="text-sm">
        <span className="font-medium" style={{ color: COLORS[name as keyof typeof COLORS] }}>
          {name}:
        </span>{' '}
        {value.toLocaleString()} packets
      </p>
    </div>
  );
};

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius: _innerRadius,
  outerRadius,
  percent,
  name,
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 24;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#1e293b"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
};

export const ProtocolPieChart: React.FC<ProtocolPieChartProps> = ({
  tcpPackets,
  udpPackets,
}) => {
  const data = [
    { name: 'TCP', value: tcpPackets },
    { name: 'UDP', value: udpPackets },
  ];

  const total = tcpPackets + udpPackets;

  return (
    <div className="glass-card-static p-5">
      <h3 className="text-title font-semibold text-text-primary mb-4 flex items-center gap-2">
        <PieChartIcon className="h-5 w-5 text-udp" />
        Protocol Distribution
      </h3>
      {total > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
              formatter={(value: string) => (
                <span className="text-text-secondary text-sm">{value}</span>
              )}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[250px] flex items-center justify-center text-text-muted text-sm">
          No data available
        </div>
      )}
    </div>
  );
};
