const API_BASE = '/api';

export const api = {
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    return res.json();
  },
  async getSensors() {
    const res = await fetch(`${API_BASE}/sensors`);
    return res.json();
  },
  async getRacks() {
    const res = await fetch(`${API_BASE}/racks`);
    return res.json();
  },
  async getPrediction() {
    const res = await fetch(`${API_BASE}/prediction`);
    return res.json();
  },
  async getCooling() {
    const res = await fetch(`${API_BASE}/cooling`);
    return res.json();
  },
  async getEnergy() {
    const res = await fetch(`${API_BASE}/energy`);
    return res.json();
  },
  async getSafety() {
    const res = await fetch(`${API_BASE}/safety`);
    return res.json();
  },
  async getEvents() {
    const res = await fetch(`${API_BASE}/events`);
    return res.json();
  },
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    return res.json();
  },
  async startSimulation() {
    const res = await fetch(`${API_BASE}/simulation/start`, { method: 'POST' });
    return res.json();
  },
  async pauseSimulation() {
    const res = await fetch(`${API_BASE}/simulation/pause`, { method: 'POST' });
    return res.json();
  },
  async resetSimulation() {
    const res = await fetch(`${API_BASE}/simulation/reset`, { method: 'POST' });
    return res.json();
  },
  async setSpeed(speed) {
    const res = await fetch(`${API_BASE}/simulation/speed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed }),
    });
    return res.json();
  },
  async setScenario(scenario, customCpu = null, customGpu = null) {
    const res = await fetch(`${API_BASE}/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, custom_cpu: customCpu, custom_gpu: customGpu }),
    });
    return res.json();
  },
  async setControlMode(mode) {
    const res = await fetch(`${API_BASE}/control-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    return res.json();
  },
  async startPresentation() {
    const res = await fetch(`${API_BASE}/presentation/start`, { method: 'POST' });
    return res.json();
  },
  async runExperiment(scenario = 'HIGH_LOAD', durationSec = 30) {
    const res = await fetch(`${API_BASE}/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, duration_sec: durationSec }),
    });
    return res.json();
  },
  async getExperiments() {
    const res = await fetch(`${API_BASE}/experiments`);
    return res.json();
  },
  async uploadDataset(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  }
};

export class TelemetryWebSocket {
  constructor(onMessage, onStatusChange) {
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
    this.ws = null;
    this.reconnectTimer = null;
    this.connect();
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.onStatusChange) this.onStatusChange(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMessage) this.onMessage(data);
        } catch (e) {
          console.error('Failed to parse telemetry frame', e);
        }
      };

      this.ws.onclose = () => {
        if (this.onStatusChange) this.onStatusChange(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.onStatusChange) this.onStatusChange(false);
        this.ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 2000);
    }
  }

  close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}
