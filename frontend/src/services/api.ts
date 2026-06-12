import { NetworkConditions, SimulationStatus, Metrics } from '../types';

const API_BASE = '/api';

export const api = {
  async startSimulation(mode: string, scenario: string) {
    const response = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, scenario }),
    });
    return response.json();
  },

  async stopSimulation() {
    const response = await fetch(`${API_BASE}/simulation/stop`, {
      method: 'POST',
    });
    return response.json();
  },

  async getStatus(): Promise<SimulationStatus> {
    const response = await fetch(`${API_BASE}/simulation/status`);
    return response.json();
  },

  async sendData(payload: string, priority: string, count: number) {
    const response = await fetch(`${API_BASE}/simulation/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, priority, count }),
    });
    return response.json();
  },

  async changeMode(mode: string) {
    const response = await fetch(`${API_BASE}/simulation/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return response.json();
  },

  async updateConditions(conditions: NetworkConditions) {
    const response = await fetch(`${API_BASE}/network/conditions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conditions),
    });
    return response.json();
  },

  async injectCongestion(level: number) {
    const response = await fetch(`${API_BASE}/network/congestion?level=${level}`, {
      method: 'POST',
    });
    return response.json();
  },

  async getScenarios() {
    const response = await fetch(`${API_BASE}/network/scenarios`);
    return response.json();
  },

  async setScenario(scenario: string) {
    const response = await fetch(`${API_BASE}/network/scenario/${scenario}`, {
      method: 'POST',
    });
    return response.json();
  },

  async getMetrics(): Promise<Metrics> {
    const response = await fetch(`${API_BASE}/metrics`);
    return response.json();
  },

  async getComparison() {
    const response = await fetch(`${API_BASE}/metrics/comparison`);
    return response.json();
  },

  async getValidation() {
    const response = await fetch(`${API_BASE}/metrics/validation`);
    return response.json();
  },

  async verifyNs3Path(ns3_path: string) {
    const response = await fetch(`${API_BASE}/ns3/verify-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ns3_path }),
    });
    return response.json();
  },

  async runNs3Simulation(ns3_path: string, scenario: string, tcp_packets: number, udp_packets: number) {
    const response = await fetch(`${API_BASE}/ns3/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ns3_path, scenario, tcp_packets, udp_packets }),
    });
    return response.json();
  },
};
