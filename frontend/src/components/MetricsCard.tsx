import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

const iconColorMap: Record<string, string> = {
  blue: 'bg-sky-50 text-sky-500',
  green: 'bg-emerald-50 text-emerald-500',
  red: 'bg-red-50 text-red-500',
  yellow: 'bg-amber-50 text-amber-500',
  purple: 'bg-violet-50 text-violet-500',
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}) => {
  const badgeClasses = iconColorMap[color] ?? iconColorMap.blue;

  return (
    <div
      className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-glass
                 hover:shadow-card-hover hover:border-primary/30
                 cursor-default"
      style={{
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: title + value + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="uppercase text-xs font-semibold tracking-wider text-text-muted">
            {title}
          </p>
          <p className="text-3xl font-bold text-text-primary mt-2 metric-value">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>

        {/* Right: icon badge */}
        {icon && (
          <div
            className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${badgeClasses}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
