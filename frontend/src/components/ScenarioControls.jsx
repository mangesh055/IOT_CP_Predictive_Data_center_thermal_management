import React, { useState } from 'react';
import { 
  PlayCircle, Flame, AlertOctagon, WifiOff, Cpu, 
  Settings2, Activity, Zap, RefreshCw, Wrench
} from 'lucide-react';

export default function ScenarioControls({ currentScenario, onSelectScenario }) {
  const [customCpu, setCustomCpu] = useState(65);
  const [customGpu, setCustomGpu] = useState(70);

  const scenarios = [
    { id: 'NORMAL', label: 'Normal Workload', icon: Activity, desc: 'CPU 40%, GPU 35%, Steady State' },
    { id: 'LOW_LOAD', label: 'Low Workload', icon: Zap, desc: 'CPU 20%, GPU 15%, Idle cluster' },
    { id: 'HIGH_LOAD', label: 'High Enterprise', icon: Cpu, desc: 'CPU 80%, GPU 75%, Heavy usage' },
    { id: 'AI_WORKLOAD', label: 'AI/GPU Tensor Load', icon: Flame, desc: 'GPU 92-96%, Deep learning training' },
    { id: 'SUDDEN_SPIKE', label: 'Sudden Workload Spike', icon: Flame, desc: 'Ramps 40% → 95% in 5 steps' },
    { id: 'ML_FAILURE', label: 'AI Prediction Failure', icon: AlertOctagon, desc: 'Underpredicts temp → Safety Override' },
    { id: 'SENSOR_FAILURE', label: 'Sensor Hardware Fault', icon: Wrench, desc: 'Rack 2 Probe B reads 38.5°C outlier' },
    { id: 'NETWORK_FAILURE', label: 'MQTT/Network Disconnect', icon: WifiOff, desc: 'Broker drops → Fail-Safe 80% Fan' },
    { id: 'COOLING_FAILURE', label: 'Cooling Plant Degradation', icon: RefreshCw, desc: 'Rack 1 fan capacity drops to 25%' },
  ];

  return (
    <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Settings2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
            Demonstration Scenarios & Failure Injection
          </h3>
        </div>
        <span className="text-xs font-mono text-cyan-400">
          Current: <strong className="text-white">{currentScenario}</strong>
        </span>
      </div>

      {/* Grid of Scenario Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isActive = currentScenario === sc.id;
          const isFailure = ['ML_FAILURE', 'SENSOR_FAILURE', 'NETWORK_FAILURE', 'COOLING_FAILURE'].includes(sc.id);

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isActive
                  ? isFailure
                    ? 'bg-rose-950/60 border-rose-500 text-white shadow-md glow-rose'
                    : 'bg-cyan-950/60 border-cyan-400 text-white shadow-md glow-cyan'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{sc.label}</span>
                <Icon className={`w-3.5 h-3.5 ${
                  isActive ? (isFailure ? 'text-rose-400' : 'text-cyan-400') : 'text-slate-500'
                }`} />
              </div>
              <p className="text-[10px] text-slate-400 font-sans line-clamp-2">{sc.desc}</p>
            </button>
          );
        })}

        {/* Custom Scenario with Interactive Sliders */}
        <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
          currentScenario === 'CUSTOM'
            ? 'bg-cyan-950/60 border-cyan-400 text-white glow-cyan'
            : 'bg-slate-900/70 border-slate-800 text-slate-300'
        }`}>
          <div>
            <div className="flex justify-between items-center text-xs font-semibold mb-1">
              <span>Custom Load</span>
              <button
                onClick={() => onSelectScenario('CUSTOM', customCpu, customGpu)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-black font-bold font-mono"
              >
                APPLY
              </button>
            </div>
            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex justify-between">
                <span>CPU: {customCpu}%</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={customCpu}
                  onChange={(e) => setCustomCpu(Number(e.target.value))}
                  className="w-16 accent-cyan-400 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-between">
                <span>GPU: {customGpu}%</span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={customGpu}
                  onChange={(e) => setCustomGpu(Number(e.target.value))}
                  className="w-16 accent-purple-400 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
