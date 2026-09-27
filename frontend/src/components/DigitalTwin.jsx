import React from 'react';
import { 
  Server, Fan, Cpu, Activity, AlertTriangle, ShieldAlert,
  Thermometer, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function DigitalTwin({ state }) {
  const racks = state?.racks || [
    { rack_id: 'RACK_1', temperature: 24.1, cpu_usage: 42, gpu_usage: 35, power_watts: 285, fan_speed: 61, status: 'NORMAL' },
    { rack_id: 'RACK_2', temperature: 24.5, cpu_usage: 48, gpu_usage: 41, power_watts: 310, fan_speed: 63, status: 'NORMAL' },
    { rack_id: 'RACK_3', temperature: 23.9, cpu_usage: 38, gpu_usage: 32, power_watts: 265, fan_speed: 59, status: 'NORMAL' },
    { rack_id: 'RACK_4', temperature: 24.3, cpu_usage: 44, gpu_usage: 37, power_watts: 295, fan_speed: 62, status: 'NORMAL' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL':
        return { label: 'CRITICAL', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' };
      case 'WARNING':
        return { label: 'WARNING', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'SENSOR_FAULT':
        return { label: 'SENSOR FAULT', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
      case 'FAIL-SAFE':
        return { label: 'FAIL-SAFE', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      default:
        return { label: 'NORMAL', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    }
  };

  const getThermalGlow = (temp) => {
    if (temp >= 27.0) return 'border-rose-500/60 shadow-rose-950/40 shadow-lg';
    if (temp >= 26.0) return 'border-amber-500/50 shadow-amber-950/30 shadow-md';
    return 'border-datacenter-border hover:border-cyan-500/40';
  };

  return (
    <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
            Data Center Digital Twin: 4-Rack Telemetry
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>&lt;26.0°C Safe</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>26-27°C Warning</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>&gt;27.0°C Safety Limit</span>
          </span>
        </div>
      </div>

      {/* 4 Racks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {racks.map((rack, idx) => {
          const badge = getStatusBadge(rack.status);
          const glow = getThermalGlow(rack.temperature);
          const fanSpinSpeed = Math.max(0.3, 2.5 - (rack.fan_speed / 100) * 2.0); // faster spin for higher fan speed

          return (
            <div
              key={rack.rack_id}
              className={`bg-slate-900/80 rounded-xl p-4 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${glow}`}
            >
              {/* Rack Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 font-mono text-xs font-bold">
                      #{idx + 1}
                    </div>
                    <span className="font-bold text-sm text-white tracking-wide">{rack.rack_id}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Primary Temperature Gauge */}
                <div className="bg-[#080d17]/80 rounded-lg p-3 border border-slate-800/80 mb-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400 font-medium">Core Temp</span>
                    <span className={`text-2xl font-bold font-mono tracking-tight ${
                      rack.temperature >= 27.0 ? 'text-rose-400' : rack.temperature >= 26.0 ? 'text-amber-400' : 'text-cyan-300'
                    }`}>
                      {rack.temperature}°C
                    </span>
                  </div>

                  {/* Inlet & Outlet Delta */}
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-1.5">
                    <span>Inlet: <strong className="text-slate-300">{rack.inlet_temp || 18.5}°C</strong></span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span>Exhaust: <strong className="text-slate-300">{rack.outlet_temp || (rack.temperature + 4.2).toFixed(1)}°C</strong></span>
                  </div>
                </div>

                {/* Redundant Sensor Array (Safety 4 Verification) */}
                <div className="mb-3 bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/60 text-[11px] font-mono">
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>Redundant Probes</span>
                    <span className="text-[9px] text-cyan-400/80">3x Median Filter</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Probe A</span>
                      <span className="text-slate-200 font-semibold">{rack.sensor_a || rack.temperature}°C</span>
                    </div>
                    <div className={`p-1 rounded border ${
                      rack.sensor_b_fault
                        ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 font-bold animate-pulse'
                        : 'bg-slate-900/80 border-slate-800 text-slate-200 font-semibold'
                    }`}>
                      <span className="text-[9px] text-slate-500 block">Probe B</span>
                      <span>{rack.sensor_b || rack.temperature}°C</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900/80 border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Probe C</span>
                      <span className="text-slate-200 font-semibold">{rack.sensor_c || rack.temperature}°C</span>
                    </div>
                  </div>
                </div>

                {/* Computational Workload: CPU & GPU */}
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-cyan-400" /> CPU Load
                      </span>
                      <span className="text-slate-200 font-bold">{rack.cpu_usage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${rack.cpu_usage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-purple-400" /> GPU Tensor
                      </span>
                      <span className="text-slate-200 font-bold">{rack.gpu_usage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          rack.gpu_usage > 85 ? 'bg-purple-400' : 'bg-indigo-400'
                        }`}
                        style={{ width: `${rack.gpu_usage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cooling & Fan Speed Actuator Footer */}
              <div className="bg-[#0b121e] rounded-lg p-2.5 border border-slate-800 flex items-center justify-between mt-1">
                <div className="flex items-center space-x-2.5">
                  <Fan
                    className="w-5 h-5 text-cyan-400 animate-spin"
                    style={{ animationDuration: `${fanSpinSpeed}s` }}
                  />
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">Fan PWM</div>
                    <div className="text-xs font-bold font-mono text-white">
                      {rack.fan_speed}% <span className="text-[10px] text-slate-400 font-normal">({rack.airflow_cfm || 210} CFM)</span>
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400">Power</div>
                  <div className="text-xs font-bold text-amber-400">{rack.power_watts}W</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
