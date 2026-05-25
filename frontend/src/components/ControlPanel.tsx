import React, { useState } from 'react';
import { Play, Square, Send, Settings } from 'lucide-react';
import { api } from '../services/api';

interface ControlPanelProps {
  isRunning: boolean;
  onStatusChange: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ isRunning, onStatusChange }) => {
  const [mode, setMode] = useState('HYBRID');
  const [scenario, setScenario] = useState('moderate');
  const [priority, setPriority] = useState('BULK');
  const [packetCount, setPacketCount] = useState(1000);

  const handleStart = async () => {
    try {
      await api.startSimulation(mode, scenario);
      onStatusChange();
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  };

  const handleStop = async () => {
    try {
      await api.stopSimulation();
      onStatusChange();
    } catch (error) {
      console.error('Failed to stop simulation:', error);
    }
  };

  const handleSendData = async () => {
    try {
      // Create a realistic 1460-byte payload (standard MTU)
      const payload = 'X'.repeat(1460);
      await api.sendData(payload, priority, packetCount);
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  };

  const handleModeChange = async (newMode: string) => {
    setMode(newMode);
    if (isRunning) {
      try {
        await api.changeMode(newMode);
      } catch (error) {
        console.error('Failed to change mode:', error);
      }
    }
  };

  const selectClasses =
    'w-full px-3 py-2.5 bg-surface-dim border border-border-subtle rounded-xl text-text-primary text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 cursor-pointer';

  return (
    <div className="glass-card-static p-6 h-full flex flex-col">
      {/* Header */}
      <h2 className="text-title font-semibold text-text-primary flex items-center gap-2 mb-5">
        <Settings className="w-5 h-5 text-primary" />
        Simulation Controls
      </h2>

      <div className="space-y-5">
        {/* ── Mode Selection ── */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Mode
          </label>
          <div className="flex bg-canvas rounded-xl p-1">
            {['TCP', 'UDP', 'HYBRID'].map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scenario Selection ── */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Network Scenario
          </label>
          <select
            value={scenario}
            onChange={(e) => {
              const newScenario = e.target.value;
              setScenario(newScenario);
              if (isRunning) {
                api.setScenario(newScenario).catch(console.error);
              }
            }}
            className={selectClasses}
          >
            <option value="ideal">Ideal</option>
            <option value="good">Good</option>
            <option value="moderate">Moderate</option>
            <option value="poor">Poor</option>
            <option value="terrible">Terrible</option>
            <option value="drone_telemetry">Drone Telemetry</option>
            <option value="live_streaming">Live Streaming</option>
            <option value="industrial_iot">Industrial IoT</option>
            <option value="disaster_response">Disaster Response</option>
          </select>
        </div>

        {/* ── Start / Stop Buttons ── */}
        {/* Push controls to bottom so they align with NetworkTopology */}
        <div className="mt-auto pt-4">
          <div className="flex gap-3">
            <button
              onClick={handleStart}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-success text-white rounded-xl font-semibold
                         hover:shadow-glow-success active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                         transition-all duration-200"
            >
              <Play className="w-4 h-4 fill-current" />
              Start
            </button>
            <button
              onClick={handleStop}
              disabled={!isRunning}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-danger text-white rounded-xl font-semibold
                         hover:shadow-glow-danger active:scale-95
                         disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                         transition-all duration-200"
            >
              <Square className="w-4 h-4 fill-current" />
              Stop
            </button>
          </div>

          {/* ── Send Test Data Section ── */}
          {isRunning && (
            <div className="pt-5 border-t border-border-subtle mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                Send Test Data
              </h3>

            <div className="space-y-4">
              {/* Priority */}
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={selectClasses}
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="REALTIME">Realtime</option>
                  <option value="BULK">Bulk</option>
                  <option value="OPTIONAL">Optional</option>
                </select>
              </div>

              {/* Packet Count */}
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">
                  Packet Count
                </label>
                <input
                  type="number"
                  value={packetCount}
                  onChange={(e) => setPacketCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2.5 bg-surface-dim border border-border-subtle rounded-xl text-text-primary text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                             transition-all duration-200"
                />
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-semibold
                           shadow-md hover:shadow-glow-primary active:scale-[0.97]
                           transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                Send Packets
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
