import React from 'react';
import { 
  Play, Pause, RotateCcw, Zap, ShieldCheck, Activity, 
  Cpu, Server, BarChart3, HelpCircle, Radio, Sparkles, AlertOctagon
} from 'lucide-react';

export default function Header({
  state,
  activeTab,
  setActiveTab,
  onStart,
  onPause,
  onReset,
  onSetSpeed,
  onSetMode,
  onStartPresentation,
  manualBreachSim = false,
  onToggleManualBreach
}) {
  const isRunning = state?.is_running ?? true;
  const speed = state?.speed_multiplier ?? 1.0;
  const controlMode = state?.control_mode ?? 'AI_PREDICTIVE';
  const presentation = state?.presentation ?? {};
  const isPresentation = presentation.active;

  return (
    <header className="border-b border-datacenter-border bg-[#0b111b]/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-6 py-3">
      {/* Top Bar: Title, System Status, Controls, Demo Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Status */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 glow-cyan">
            <Server className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>AI Data Center Thermal Management</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-mono">
                  IoT + ML + Safety
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Safe AI-Driven Cooling Optimization Using Distributed IoT Sensors & Multi-Tier Safety
            </p>
          </div>
        </div>

        {/* Global Controls & Presentation Trigger */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          {/* Simulation Time */}
          <div className="flex items-center bg-slate-900/90 border border-datacenter-border px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
            <span className="text-slate-500 mr-2">TIME:</span>
            <span className="text-cyan-400 font-semibold">{state?.sim_time_formatted || '00:00'}</span>
          </div>

          {/* Start/Pause and Reset Buttons */}
          <div className="flex items-center bg-slate-900/90 border border-datacenter-border p-1 rounded-lg">
            {isRunning ? (
              <button
                onClick={onPause}
                title="Pause Simulation"
                className="p-1.5 rounded text-amber-400 hover:bg-amber-400/20 hover:text-amber-300 transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onStart}
                title="Resume Simulation"
                className="p-1.5 rounded text-emerald-400 hover:bg-emerald-400/20 hover:text-emerald-300 transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onReset}
              title="Reset Simulation"
              className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Cinematic High Alert / Breach Mode Button */}
          {onToggleManualBreach && (
            <button
              onClick={onToggleManualBreach}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all shadow-md ${
                manualBreachSim
                  ? 'bg-rose-600 text-white border border-rose-400 animate-pulse shadow-rose-900/60'
                  : 'bg-rose-950/70 hover:bg-rose-900/90 text-rose-300 border border-rose-700/60 hover:text-white'
              }`}
              title="Toggle cinematic Hollywood movie hacking / critical breach alert mode"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>{manualBreachSim ? '🚨 STOP BREACH SIM' : '⚡ MOVIE ALERT FX'}</span>
            </button>
          )}

          {/* Presentation Mode Button */}
          <button
            onClick={onStartPresentation}
            disabled={isPresentation}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md ${
              isPresentation
                ? 'bg-purple-600/30 border border-purple-500 text-purple-300 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40 hover:shadow-purple-700/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>{isPresentation ? `DEMO STEP ${presentation.step || 1}/6` : 'PRESENTATION MODE'}</span>
          </button>
        </div>
      </div>

      {/* Presentation Narrative Banner when active */}
      {isPresentation && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/50 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
            <span className="font-semibold text-purple-300">Guided Presentation Walkthrough:</span>
            <span className="text-slate-300 font-mono">
              {presentation.log && presentation.log.length > 0 ? presentation.log[presentation.log.length - 1] : 'Executing demonstration story...'}
            </span>
          </div>
          <span className="text-[10px] text-purple-400 font-mono px-2 py-0.5 rounded bg-purple-900/60">
            Auto-advancing
          </span>
        </div>
      )}

      {/* Bottom Bar: Mode Switcher & Navigation Tabs */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'dashboard', label: 'Digital Twin Dashboard', icon: Server },
            { id: 'safety', label: 'Safety & Reliability', icon: ShieldCheck },
            { id: 'ml', label: 'ML Prediction', icon: Cpu },
            { id: 'experiments', label: 'Benchmark Experiments', icon: BarChart3 },
            { id: 'architecture', label: 'IoT Architecture & MQTT', icon: Radio },
            { id: 'explainer', label: 'System Explainer FAQ', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Control Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900/90 border border-datacenter-border p-1 rounded-lg text-xs">
          <span className="text-[11px] text-slate-500 px-2 font-mono">MODE:</span>
          {[
            { id: 'TRADITIONAL', label: 'Traditional (80% Fan)' },
            { id: 'REACTIVE', label: 'Reactive IoT' },
            { id: 'AI_PREDICTIVE', label: 'AI Predictive' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSetMode(mode.id)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                controlMode === mode.id
                  ? mode.id === 'AI_PREDICTIVE'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
