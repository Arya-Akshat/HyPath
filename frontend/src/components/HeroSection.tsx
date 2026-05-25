import React from 'react';
import { Network, Activity, Zap } from 'lucide-react';

const features = [
  { label: 'Adaptive Routing', icon: Network },
  { label: 'Real-time Telemetry', icon: Activity },
  { label: 'Congestion-Aware', icon: Zap },
] as const;

export const HeroSection: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden bg-transparent py-20 px-6 sm:py-28 sm:px-8">
      {/* Subtle radial gradient accent */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary-light/40 blur-[140px]" />
        <div className="absolute right-0 top-0 w-[400px] h-[400px] rounded-full bg-primary-light/20 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Small protocol badge */}
        <div className="animate-slide-up mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-dim px-4 py-1.5">
          <Network className="h-3.5 w-3.5 text-primary" />
          <span className="text-label uppercase text-text-secondary tracking-widest">
            Protocol Simulator
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-slide-up-delay-1 text-display text-text-primary tracking-[-0.03em] leading-[1.1]">
          Hybrid Multi‑Path{' '}
          <span className="bg-gradient-to-r from-primary to-udp bg-clip-text text-transparent">
            Transport Protocol
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up-delay-2 mt-5 text-base sm:text-lg leading-relaxed text-text-secondary max-w-xl mx-auto">
          Intelligent packet routing across TCP and UDP paths — adapting in
          real&#8209;time to latency, reliability, congestion, and packet loss
          for optimal network performance.
        </p>

        {/* Feature pills */}
        <div className="animate-slide-up-delay-3 mt-8 flex flex-wrap items-center justify-center gap-3">
          {features.map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="group flex items-center gap-2 rounded-full border border-border-glass bg-white/80 backdrop-blur-sm px-4 py-2 shadow-glass transition-all duration-300 hover:shadow-glass-hover hover:border-primary/30 hover:-translate-y-0.5"
            >
              <Icon className="h-4 w-4 text-primary transition-colors group-hover:text-primary-dark" />
              <span className="text-data font-medium text-text-primary">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade-out edge */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-transparent to-transparent" />
    </section>
  );
};

export default HeroSection;
