import React from 'react';
import { 
  Thermometer, TrendingUp, Zap, Leaf, Target, ShieldCheck, 
  AlertTriangle, ShieldAlert, Cpu
} from 'lucide-react';

export default function KpiCards({ state }) {
  const avgTemp = state?.avg_temp ?? 24.2;
  const maxTemp = state?.max_temp ?? 24.5;
  const primaryDecision = state?.primary_decision ?? {};
  const prediction = primaryDecision?.prediction ?? {};
  const pred15m = prediction?.pred_15m ?? 25.1;
  const confidence = prediction?.confidence ?? 94.0;
  
  const totalPowerW = state?.total_cooling_power_w ?? 310.0;
  const totalEnergyKwh = state?.total_cooling_energy_kwh ?? 0.045;
  const energySavings = state?.energy_savings_pct ?? 28.5;
  
  const safetyStatus = state?.safety_status ?? {};
  const isOverridden = primaryDecision?.overridden ?? false;
  const isNetworkFail = safetyStatus?.network === 'FAIL';
  const isHardLimitBreach = safetyStatus?.hard_limit === 'CRITICAL';

  let safetyBadge = { text: 'ALL PASS', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (isHardLimitBreach) {
    safetyBadge = { text: 'LIMIT BREACH', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40 animate-pulse' };
  } else if (isNetworkFail || safetyStatus?.fail_safe === 'ACTIVE') {
    safetyBadge = { text: 'FAIL-SAFE ACTIVE', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' };
  } else if (isOverridden) {
    safetyBadge = { text: 'AI OVERRIDDEN', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' };
  } else if (safetyStatus?.rate_of_rise === 'WARNING') {
    safetyBadge = { text: 'RAPID RISE', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' };
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Current Temperature */}
      <div className="glass-panel p-3.5 rounded-xl border border-datacenter-border relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Current Temp</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Thermometer className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-white">{avgTemp}°C</span>
          <span className="text-xs text-slate-400">avg</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Max: <strong className={maxTemp >= 27.0 ? 'text-rose-400' : 'text-slate-300'}>{maxTemp}°C</strong></span>
          <span className="text-[10px] text-cyan-400/80">Limit 27°C</span>
        </div>
      </div>

      {/* 2. Predicted Temperature */}
      <div className="glass-panel p-3.5 rounded-xl border border-datacenter-border relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Predicted (+15m)</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-cyan-300">{pred15m}°C</span>
          <span className="text-[11px] text-slate-400 font-mono">est.</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Margin:</span>
          <span className={`font-semibold ${27.0 - pred15m < 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {(27.0 - pred15m).toFixed(1)}°C safe
          </span>
        </div>
      </div>

      {/* 3. Cooling Power Draw */}
      <div className="glass-panel p-3.5 rounded-xl border border-datacenter-border relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Cooling Power</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-white">{totalPowerW}</span>
          <span className="text-xs text-slate-400">Watts</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400 font-mono flex items-center justify-between">
          <span>Fans + Chiller Plant</span>
          <span className="text-slate-500">P ∝ RPM³</span>
        </div>
      </div>

      {/* 4. Energy Consumption & Savings */}
      <div className="glass-panel p-3.5 rounded-xl border border-datacenter-border relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Energy Consumption</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Leaf className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-white">{totalEnergyKwh}</span>
          <span className="text-xs text-slate-400">kWh</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Est. Savings:</span>
          <span className="text-emerald-400 font-bold">
            {energySavings > 0 ? `-${energySavings}%` : '--'}
          </span>
        </div>
      </div>

      {/* 5. AI Confidence */}
      <div className="glass-panel p-3.5 rounded-xl border border-datacenter-border relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">AI Confidence</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-white">{confidence}%</span>
        </div>
        <div className="mt-1 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              confidence > 85 ? 'bg-cyan-400' : confidence > 60 ? 'bg-amber-400' : 'bg-rose-400'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>

      {/* 6. System Safety Status */}
      <div className="glass-panel p-3.5 rounded-xl border border-datacenter-border relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">Safety Layer</span>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${safetyBadge.bg} ${safetyBadge.color}`}>
            {safetyBadge.text}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400 font-mono truncate">
          {isOverridden ? 'AI Overridden for Safety' : '5 Checks Enforced'}
        </div>
      </div>
    </div>
  );
}
