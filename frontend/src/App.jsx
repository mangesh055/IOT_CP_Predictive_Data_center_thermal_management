import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SafetyPage from './pages/SafetyPage';
import MLPage from './pages/MLPage';
import ExperimentPage from './pages/ExperimentPage';
import ArchitecturePage from './pages/ArchitecturePage';
import ExplainerPage from './pages/ExplainerPage';
import { api, TelemetryWebSocket } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const wsRef = useRef(null);

  // Initialize WebSocket and initial state polling
  useEffect(() => {
    // 1. Initial HTTP poll
    api.getRacks().then((data) => {
      if (data) setState((prev) => ({ ...prev, ...data }));
    }).catch((e) => console.log('Initial fetch', e));

    // 2. Setup WebSocket connection
    wsRef.current = new TelemetryWebSocket(
      (telemetryFrame) => {
        setState(telemetryFrame);

        // Append to rolling chart history
        const nowStr = telemetryFrame.timestamp || new Date().toLocaleTimeString();
        const primary = telemetryFrame.primary_decision || {};
        const pred = primary.prediction || {};
        const racks = telemetryFrame.racks || [];

        const newPoint = {
          time: nowStr,
          actual_temp: telemetryFrame.avg_temp || 24.2,
          pred_5m: pred.pred_5m || 24.8,
          pred_15m: pred.pred_15m || 25.5,
          safety_limit: 27.0,
          cpu_usage: racks[0]?.cpu_usage || 40,
          gpu_usage: racks[0]?.gpu_usage || 35,
          server_power: racks[0]?.power_watts || 280,
          cooling_power: telemetryFrame.total_cooling_power_w || 310,
          ai_fan: primary.recommended_fan || 60,
          actual_fan: primary.sanctioned_fan || 60,
          rack1_temp: racks[0]?.temperature || 24.0,
          rack2_temp: racks[1]?.temperature || 24.2,
          rack3_temp: racks[2]?.temperature || 23.9,
          rack4_temp: racks[3]?.temperature || 24.1,
        };

        setHistoryData((prev) => {
          const updated = [...prev, newPoint];
          return updated.length > 35 ? updated.slice(updated.length - 35) : updated;
        });
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Controls Handlers
  const handleStart = () => api.startSimulation();
  const handlePause = () => api.pauseSimulation();
  const handleReset = () => {
    api.resetSimulation();
    setHistoryData([]);
  };
  const handleSetSpeed = (spd) => api.setSpeed(spd);
  const handleSetMode = (mode) => api.setControlMode(mode);
  const handleSelectScenario = (sc, cpu, gpu) => api.setScenario(sc, cpu, gpu);
  const handleStartPresentation = () => api.startPresentation();

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        state={state}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onSetSpeed={handleSetSpeed}
        onSetMode={handleSetMode}
        onStartPresentation={handleStartPresentation}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            state={state}
            historyData={historyData}
            onSelectScenario={handleSelectScenario}
          />
        )}
        {activeTab === 'safety' && (
          <SafetyPage
            state={state}
            onSelectScenario={handleSelectScenario}
          />
        )}
        {activeTab === 'ml' && (
          <MLPage state={state} />
        )}
        {activeTab === 'experiments' && (
          <ExperimentPage />
        )}
        {activeTab === 'architecture' && (
          <ArchitecturePage state={state} />
        )}
        {activeTab === 'explainer' && (
          <ExplainerPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#080d17] px-6 py-4 text-xs font-mono text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
          <span>WebSocket Telemetry: <strong className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>{isConnected ? 'CONNECTED (10Hz)' : 'RECONNECTING...'}</strong></span>
        </div>
        <div>
          <span>AI-Based Predictive Thermal Management Prototype • Digital Twin Simulation</span>
        </div>
      </footer>
    </div>
  );
}
