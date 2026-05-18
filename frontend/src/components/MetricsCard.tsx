import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm opacity-70">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="ml-4 opacity-50">{icon}</div>}
      </div>
    </div>
  );
};
