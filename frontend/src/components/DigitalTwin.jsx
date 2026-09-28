import React from 'react';
import { 
  Server, Fan, Cpu, Activity, AlertTriangle, ShieldAlert,
  Thermometer, CheckCircle2, ArrowRight, Zap, Flame, TrendingUp
} from 'lucide-react';

function getRackRootCause(rack, state) {
  const isWarning = rack.status === 'WARNING' || 
    (rack.temperature >= 26.0 && rack.temperature < 27.0) || 
    (rack.rate_of_rise && rack.rate_of_rise >= 0.25);
  
  if (!isWarning) return null;

  const hardLimit = state?.custom_settings?.hard_temp_limit || 27.0;
  const issues = [];
  let primaryCategory = 'THERMAL SURGE';
  let highlightMetric = 'temp';

  // 1. Contextual Scenario Checks
  if (state?.custom_settings?.spike_active || state?.scenario === 'SUDDEN_SPIKE') {
    issues.push({
      label: 'Workload Spike Injected',
      detail: 'Abrupt +95% workload transient injecting sudden heat burst into processor dies.'
    });
    primaryCategory = 'WORKLOAD BURST SPIKE';
    highlightMetric = 'workload';
  } else if (state?.custom_settings?.heatwave_active) {
    issues.push({
      label: 'Facility Heatwave Surge',
      detail: 'External ambient intake surge (+6°C) choking cooling temperature differential.'
    });
    primaryCategory = 'AMBIENT HEATWAVE';
    highlightMetric = 'inlet';
  } else if (state?.scenario === 'AI_WORKLOAD') {
    issues.push({
      label: 'Continuous AI Tensor Crunch',
      detail: 'High GPU tensor core load driving sustained high-density thermal output.'
    });
    primaryCategory = 'TENSOR CORE HEATWAVE';
    highlightMetric = 'workload';
  }

  // 2. Rate-of-Rise Steep Surge Check
  if (rack.rate_of_rise && rack.rate_of_rise >= 0.25) {
    primaryCategory = primaryCategory === 'THERMAL SURGE' ? 'RAPID THERMAL RISE (dT/dt)' : primaryCategory;
    highlightMetric = 'rate';
    issues.push({
      label: 'Thermal Rise Gradient',
      detail: `Rate of rise (+${rack.rate_of_rise.toFixed(2)}°C/step) exceeded safety threshold of 0.25°C/step.`
    });
  }

  // 3. Absolute Temperature Proximity Check
  if (rack.temperature >= 26.0) {
    const margin = (hardLimit - rack.temperature).toFixed(1);
    issues.push({
      label: 'Safety Threshold Proximity',
      detail: `Operating at ${rack.temperature}°C, within ${margin}°C of hard limit (${hardLimit.toFixed(1)}°C).`
    });
    if (rack.temperature >= 26.3) {
      primaryCategory = 'SAFETY LIMIT PROXIMITY';
      highlightMetric = 'temp';
    }
  }

  // 4. Computational Workload Heat Dissipation
  if ((rack.cpu_usage || 0) >= 75 || (rack.gpu_usage || 0) >= 75) {
    issues.push({
      label: 'Heavy Compute Density',
      detail: `CPU at ${rack.cpu_usage}% / GPU at ${rack.gpu_usage}% generating ${rack.power_watts || 300}W of thermal flux.`
    });
    if (issues.length === 1) highlightMetric = 'workload';
  }

  // 5. Elevated Inlet Air
  if (rack.inlet_temp && rack.inlet_temp >= 21.0) {
    issues.push({
      label: 'Elevated Inlet Air',
      detail: `Inlet air at ${rack.inlet_temp}°C (optimal < 20.0°C) limiting cooling effectiveness.`
    });
  }

  // Default fallback if no specific issue logged
  if (issues.length === 0) {
    issues.push({
      label: 'Elevated Thermal Gradient',
      detail: `Temperature is at ${rack.temperature}°C. Predictive AI adjusting fan PWM.`
    });
  }

  return {
    category: primaryCategory,
    primaryCause: issues[0],
    secondaryCause: issues[1] || null,
    highlightMetric
  };
}

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
        return { label: 'WARNING', bg: 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse font-bold' };
      case 'SENSOR_FAULT':
        return { label: 'SENSOR FAULT', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40' };
      case 'FAIL-SAFE':
        return { label: 'FAIL-SAFE', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      default:
        return { label: 'NORMAL', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    }
  };

  const getThermalGlow = (temp, isCrit, isWarn) => {
    if (isCrit || temp >= 27.0) {
      return 'border-rose-500 shadow-rose-950/80 shadow-2xl ring-2 ring-rose-500/60 bg-gradient-to-b from-rose-950/30 to-slate-900/90';
    }
    if (isWarn || temp >= 26.0) {
      return 'warning-edge-glow ring-2 ring-amber-400/60 bg-gradient-to-b from-amber-950/30 to-slate-900/95';
    }
    return 'border-datacenter-border hover:border-cyan-500/40 bg-slate-900/80';
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
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-rose-400 font-bold">&gt;27.0°C Safety Limit</span>
          </span>
        </div>
      </div>

      {/* 4 Racks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {racks.map((rack, idx) => {
          const isCritical = rack.status === 'CRITICAL' || rack.temperature >= 27.0;
          const isWarning = !isCritical && (
            rack.status === 'WARNING' || 
            rack.temperature >= 26.0 || 
            (rack.rate_of_rise && rack.rate_of_rise >= 0.25)
          );
          const rootCause = isWarning ? getRackRootCause(rack, state) : null;
          const badge = getStatusBadge(isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : rack.status);
          const glow = getThermalGlow(rack.temperature, isCritical, isWarning);
          const fanSpinSpeed = Math.max(0.3, 2.5 - (rack.fan_speed / 100) * 2.0); // faster spin for higher fan speed

          return (
            <div
              key={rack.rack_id}
              className={`rounded-xl p-4 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${glow}`}
            >
              {/* Critical Hollywood Hazard Stripe on Rack */}
              {isCritical && (
                <div className="absolute top-0 left-0 right-0 h-1.5 hazard-stripe-red" />
              )}

              {/* Warning Glowing Edge Hazard Stripe on Rack */}
              {isWarning && (
                <div className="absolute top-0 left-0 right-0 h-1.5 hazard-stripe-amber" />
              )}

              {/* Rack Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                      isCritical 
                        ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse' 
                        : isWarning
                        ? 'bg-amber-950 text-amber-300 border border-amber-500 animate-pulse'
                        : 'bg-slate-800 text-cyan-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <span className="font-bold text-sm text-white tracking-wide">{rack.rack_id}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${badge.bg}`}>
                    {isWarning && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
                    {badge.label}
                  </span>
                </div>

                {/* Primary Temperature Gauge */}
                <div className={`rounded-lg p-3 border mb-3 transition-all ${
                  isWarning && rootCause?.highlightMetric === 'temp'
                    ? 'bg-amber-950/30 border-amber-500/70 shadow-sm shadow-amber-900/40'
                    : 'bg-[#080d17]/80 border-slate-800/80'
                }`}>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-slate-400 font-medium">Core Temp</span>
                      {isWarning && rack.rate_of_rise && rack.rate_of_rise >= 0.20 && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          dT/dt: +{rack.rate_of_rise.toFixed(2)}°C
                        </span>
                      )}
                    </div>
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

                {/* Dedicated Root Cause Highlight Box for Warning Rack */}
                {isWarning && rootCause && (
                  <div className="mb-3 p-2.5 rounded-lg bg-amber-950/70 border-2 border-amber-500/80 font-mono text-xs shadow-lg shadow-amber-950/70 animate-fadeIn">
                    <div className="flex items-center justify-between text-amber-300 font-bold mb-1.5 pb-1 border-b border-amber-700/60">
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-bounce" />
                        <span className="text-amber-300 font-black">ROOT CAUSE: {rootCause.category}</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200 font-bold border border-amber-400/60">
                        DIAGNOSTIC
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-[10px] text-amber-100 flex items-start gap-1.5 leading-snug">
                        <span className="text-amber-400 font-bold shrink-0">▸</span>
                        <span>
                          <strong className="text-amber-300">{rootCause.primaryCause.label}:</strong> {rootCause.primaryCause.detail}
                        </span>
                      </div>
                      {rootCause.secondaryCause && (
                        <div className="text-[9px] text-amber-200/80 flex items-start gap-1.5 pt-1 border-t border-amber-900/60 leading-snug">
                          <span className="text-amber-500 shrink-0">•</span>
                          <span>
                            <strong className="text-amber-400">{rootCause.secondaryCause.label}:</strong> {rootCause.secondaryCause.detail}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                <div className={`space-y-2 mb-3 rounded-lg p-1.5 transition-all ${
                  isWarning && rootCause?.highlightMetric === 'workload' 
                    ? 'bg-amber-950/25 border border-amber-500/40' 
                    : ''
                }`}>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Cpu className={`w-3 h-3 ${isWarning && rootCause?.highlightMetric === 'workload' ? 'text-amber-400' : 'text-cyan-400'}`} /> CPU Load
                        {isWarning && (rack.cpu_usage || 0) >= 75 && (
                          <span className="text-[9px] text-amber-300 font-bold ml-1 animate-pulse">⚠️ High Heat Flux</span>
                        )}
                      </span>
                      <span className={`font-bold ${isWarning && (rack.cpu_usage || 0) >= 75 ? 'text-amber-300' : 'text-slate-200'}`}>
                        {rack.cpu_usage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isWarning && (rack.cpu_usage || 0) >= 75 ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${rack.cpu_usage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Activity className={`w-3 h-3 ${isWarning && rootCause?.highlightMetric === 'workload' ? 'text-amber-400' : 'text-purple-400'}`} /> GPU Tensor
                        {isWarning && (rack.gpu_usage || 0) >= 75 && (
                          <span className="text-[9px] text-amber-300 font-bold ml-1 animate-pulse">⚠️ Tensor Heat</span>
                        )}
                      </span>
                      <span className={`font-bold ${isWarning && (rack.gpu_usage || 0) >= 75 ? 'text-amber-300' : 'text-slate-200'}`}>
                        {rack.gpu_usage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isWarning && (rack.gpu_usage || 0) >= 75
                            ? 'bg-amber-400'
                            : rack.gpu_usage > 85
                            ? 'bg-purple-400'
                            : 'bg-indigo-400'
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
