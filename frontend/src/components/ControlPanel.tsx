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
  const [packetCount, setPacketCount] = useState(10);

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
      await api.sendData('Test payload data', priority, packetCount);
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

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-4 text-gray-200 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Control Panel
      </h2>

      <div className="space-y-4">
        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Mode</label>
          <div className="flex gap-2">
            {['TCP', 'UDP', 'HYBRID'].map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === m
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Network Scenario</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200"
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

        {/* Start/Stop Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </div>

        {/* Send Data Section */}
        {isRunning && (
          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Send Test Data</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="REALTIME">Realtime</option>
                  <option value="BULK">Bulk</option>
                  <option value="OPTIONAL">Optional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Packet Count</label>
                <input
                  type="number"
                  value={packetCount}
                  onChange={(e) => setPacketCount(parseInt(e.target.value) || 1)}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm"
                />
              </div>

              <button
                onClick={handleSendData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                Send Packets
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
