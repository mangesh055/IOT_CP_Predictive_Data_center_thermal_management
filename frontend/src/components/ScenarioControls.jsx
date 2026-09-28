import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, AlertOctagon, WifiOff, Cpu, 
  Settings2, Activity, Zap, RefreshCw, Wrench,
  Sliders, Waves, Gauge, Wind, Thermometer, Sparkles, ShieldAlert
} from 'lucide-react';

export default function ScenarioControls({
  currentScenario = 'NORMAL',
  customSettings = {},
  onSelectScenario,
  onCustomParameters,
  onTriggerEvent,
  manualBreachSim = false,
  onToggleManualBreach
}) {
  const [activeTab, setActiveTab] = useState('customizer'); // 'customizer' | 'scenarios'

  // Local state for interactive sliders
  const [cpu, setCpu] = useState(customSettings.custom_cpu || 45);
  const [gpu, setGpu] = useState(customSettings.custom_gpu || 40);
  const [ambientTemp, setAmbientTemp] = useState(customSettings.ambient_temp || 22.0);
  const [inletTemp, setInletTemp] = useState(customSettings.inlet_temp || 18.5);
  const [responsiveness, setResponsiveness] = useState(customSettings.thermal_responsiveness || 1.5);
  const [safetyLimit, setSafetyLimit] = useState(customSettings.hard_temp_limit || 27.0);
  const [pattern, setPattern] = useState(customSettings.workload_pattern || 'DYNAMIC_WAVE');

  const debounceTimerRef = useRef(null);

  // Sync from props if external update occurs
  useEffect(() => {
    if (customSettings.custom_cpu !== undefined) setCpu(customSettings.custom_cpu);
    if (customSettings.custom_gpu !== undefined) setGpu(customSettings.custom_gpu);
    if (customSettings.ambient_temp !== undefined) setAmbientTemp(customSettings.ambient_temp);
    if (customSettings.inlet_temp !== undefined) setInletTemp(customSettings.inlet_temp);
    if (customSettings.thermal_responsiveness !== undefined) setResponsiveness(customSettings.thermal_responsiveness);
    if (customSettings.hard_temp_limit !== undefined) setSafetyLimit(customSettings.hard_temp_limit);
    if (customSettings.workload_pattern !== undefined) setPattern(customSettings.workload_pattern);
  }, [
    customSettings.custom_cpu,
    customSettings.custom_gpu,
    customSettings.ambient_temp,
    customSettings.inlet_temp,
    customSettings.thermal_responsiveness,
    customSettings.hard_temp_limit,
    customSettings.workload_pattern
  ]);

  // Immediate API update on slider change (25ms)
  const dispatchUpdate = (overrides = {}) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (onCustomParameters) {
        onCustomParameters({
          custom_cpu: overrides.cpu !== undefined ? overrides.cpu : cpu,
          custom_gpu: overrides.gpu !== undefined ? overrides.gpu : gpu,
          ambient_temp: overrides.ambientTemp !== undefined ? overrides.ambientTemp : ambientTemp,
          inlet_temp: overrides.inletTemp !== undefined ? overrides.inletTemp : inletTemp,
          thermal_responsiveness: overrides.responsiveness !== undefined ? overrides.responsiveness : responsiveness,
          hard_limit: overrides.safetyLimit !== undefined ? overrides.safetyLimit : safetyLimit,
          workload_pattern: overrides.pattern !== undefined ? overrides.pattern : pattern,
        });
      }
    }, 25);
  };

  const handleCpuChange = (val) => {
    const v = Number(val);
    setCpu(v);
    dispatchUpdate({ cpu: v });
  };

  const handleGpuChange = (val) => {
    const v = Number(val);
    setGpu(v);
    dispatchUpdate({ gpu: v });
  };

  const handleAmbientChange = (val) => {
    const v = Number(val);
    setAmbientTemp(v);
    dispatchUpdate({ ambientTemp: v });
  };

  const handleInletChange = (val) => {
    const v = Number(val);
    setInletTemp(v);
    dispatchUpdate({ inletTemp: v });
  };

  const handleResponsivenessChange = (val) => {
    const v = Number(val);
    setResponsiveness(v);
    dispatchUpdate({ responsiveness: v });
  };

  const handleSafetyLimitChange = (val) => {
    const v = Number(val);
    setSafetyLimit(v);
    dispatchUpdate({ safetyLimit: v });
  };

  const handlePatternChange = (pat) => {
    setPattern(pat);
    dispatchUpdate({ pattern: pat });
  };

  const patterns = [
    { id: 'DYNAMIC_WAVE', label: 'Dynamic Wave', icon: Waves, desc: 'Sine waves + micro-bursts' },
    { id: 'BATCH_SPIKES', label: 'Batch Spikes', icon: Zap, desc: 'Cyclic heavy processing' },
    { id: 'AI_EPOCHS', label: 'AI Epochs', icon: Flame, desc: 'Deep learning train/eval cycles' },
    { id: 'CONSTANT', label: 'Constant Load', icon: Gauge, desc: 'Fixed steady-state level' },
    { id: 'CHAOS', label: 'Chaos Cluster', icon: AlertOctagon, desc: 'Asynchronous rack swings' },
  ];

  const scenarios = [
    { id: 'NORMAL', label: 'Normal Workload', icon: Activity, desc: 'CPU 40%, GPU 35%, Dynamic closed loop' },
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
      {/* Header and Mode Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Settings2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
            <span>Simulation Control & Live Customizer</span>
            {customSettings.spike_active && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                ⚡ SPIKE ACTIVE
              </span>
            )}
            {customSettings.heatwave_active && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                🌡️ HEATWAVE ACTIVE
              </span>
            )}
          </h3>
        </div>

        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('customizer')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'customizer'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Live Customizer</span>
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === 'scenarios'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scenarios & Faults</span>
          </button>
        </div>
      </div>

      {activeTab === 'customizer' ? (
        <div className="space-y-4">
          {/* Workload Pattern Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                Workload Dynamics Pattern
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                Pattern: <strong>{pattern}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {patterns.map((p) => {
                const Icon = p.icon;
                const isSelected = pattern === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePatternChange(p.id)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm glow-cyan'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{p.label}</span>
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
            {/* CPU Workload */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Baseline:
                </span>
                <span className="text-cyan-400 font-bold bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/50">
                  {cpu}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={cpu}
                onChange={(e) => handleCpuChange(e.target.value)}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5% Idle</span>
                <span>100% Max</span>
              </div>
            </div>

            {/* GPU Workload */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-purple-400" /> GPU Baseline:
                </span>
                <span className="text-purple-400 font-bold bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800/50">
                  {gpu}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="1"
                value={gpu}
                onChange={(e) => handleGpuChange(e.target.value)}
                className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5% Idle</span>
                <span>100% Tensor</span>
              </div>
            </div>

            {/* Ambient Room Temp */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" /> Ambient Room:
                </span>
                <span className={`font-bold px-2 py-0.5 rounded border ${
                  ambientTemp > 28
                    ? 'text-rose-400 bg-rose-950/70 border-rose-800/50'
                    : ambientTemp > 24
                    ? 'text-amber-400 bg-amber-950/70 border-amber-800/50'
                    : 'text-emerald-400 bg-emerald-950/70 border-emerald-800/50'
                }`}>
                  {ambientTemp.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="16.0"
                max="36.0"
                step="0.5"
                value={ambientTemp}
                onChange={(e) => handleAmbientChange(e.target.value)}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>16°C Chilled</span>
                <span>36°C Severe</span>
              </div>
            </div>

            {/* Inlet Supply Air Temp */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-400" /> Inlet Supply Air:
                </span>
                <span className="text-blue-400 font-bold bg-blue-950/70 px-2 py-0.5 rounded border border-blue-800/50">
                  {inletTemp.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="14.0"
                max="24.0"
                step="0.5"
                value={inletTemp}
                onChange={(e) => handleInletChange(e.target.value)}
                className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>14°C Cold CRAH</span>
                <span>24°C Warm Air</span>
              </div>
            </div>

            {/* Thermal Dynamics Responsiveness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Physics Response:
                </span>
                <span className="text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/50">
                  {responsiveness.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={responsiveness}
                onChange={(e) => handleResponsivenessChange(e.target.value)}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5x Slow Mass</span>
                <span>3.0x Snappy Realtime</span>
              </div>
            </div>

            {/* Hard Safety Limit */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Hard Safety Limit:
                </span>
                <span className="text-rose-400 font-bold bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800/50">
                  {safetyLimit.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="24.0"
                max="30.0"
                step="0.2"
                value={safetyLimit}
                onChange={(e) => handleSafetyLimitChange(e.target.value)}
                className="w-full accent-rose-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>24°C Strict</span>
                <span>30°C Relaxed</span>
              </div>
            </div>
          </div>

          {/* Rapid 1-Click Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-mono text-slate-400">1-Click Live Triggers:</span>
            <div className="flex flex-wrap items-center gap-2">
              {onToggleManualBreach && (
                <button
                  onClick={onToggleManualBreach}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    manualBreachSim
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse shadow-md shadow-rose-900/60'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                  }`}
                  title="Simulate cinematic Hollywood movie hacking / high alert breach mode"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>{manualBreachSim ? '🚨 Exit Movie Breach' : '⚡ Simulate High Alert'}</span>
                </button>
              )}

              <button
                onClick={() => onTriggerEvent && onTriggerEvent('THERMAL_SPIKE')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Inject 15s Spike (+95%)</span>
              </button>

              <button
                onClick={() => onTriggerEvent && onTriggerEvent('HEATWAVE')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                <span>Heatwave Surge (+6°C)</span>
              </button>

              <button
                onClick={() => onTriggerEvent && onTriggerEvent('COOLING_BLAST')}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                <span>Emergency 100% Fan</span>
              </button>

              <button
                onClick={() => {
                  setCpu(45);
                  setGpu(40);
                  setAmbientTemp(22.0);
                  setInletTemp(18.5);
                  setResponsiveness(1.5);
                  setSafetyLimit(27.0);
                  setPattern('DYNAMIC_WAVE');
                  if (onTriggerEvent) onTriggerEvent('RESET_OVERRIDE');
                  dispatchUpdate({
                    cpu: 45,
                    gpu: 40,
                    ambientTemp: 22.0,
                    inletTemp: 18.5,
                    responsiveness: 1.5,
                    safetyLimit: 27.0,
                    pattern: 'DYNAMIC_WAVE'
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preset Scenarios & Failure Injection */
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
        </div>
      )}
    </div>
  );
}
