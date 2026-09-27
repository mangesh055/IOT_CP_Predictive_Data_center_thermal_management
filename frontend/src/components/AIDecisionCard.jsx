import React from 'react';
import { 
  BrainCircuit, ShieldAlert, CheckCircle, ArrowRight, 
  HelpCircle, Sliders, ShieldCheck, AlertCircle
} from 'lucide-react';

export default function AIDecisionCard({ state }) {
  const primaryDecision = state?.primary_decision || {};
  const prediction = primaryDecision?.prediction || {};
  const optimizer = primaryDecision?.optimizer || {};
  const safety = primaryDecision?.safety || {};

  const currentFan = primaryDecision?.current_fan ?? 60.0;
  const recommendedFan = primaryDecision?.recommended_fan ?? 65.0;
  const sanctionedFan = primaryDecision?.sanctioned_fan ?? 65.0;
  const isOverridden = primaryDecision?.overridden ?? false;
  const reasonText = primaryDecision?.reason || optimizer?.reason || 'AI recommendation within safety envelope.';

  const pred5m = prediction?.pred_5m ?? 24.8;
  const pred10m = prediction?.pred_10m ?? 25.4;
  const pred15m = prediction?.pred_15m ?? 26.0;
  const confidence = prediction?.confidence ?? 94.0;
  const safetyMargin = (27.0 - pred15m).toFixed(1);

  return (
    <div className="glass-panel p-4 rounded-xl border border-datacenter-border h-full flex flex-col justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
              Explainable AI Closed-Loop Decision
            </h3>
          </div>
          {isOverridden ? (
            <span className="flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SAFETY OVERRIDE</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SAFETY SANCTIONED</span>
            </span>
          )}
        </div>

        {/* Closed Loop Control Flow Flowchart */}
        <div className="bg-[#080d17]/80 rounded-lg p-3 border border-slate-800/80 mb-3 font-mono text-xs">
          <div className="grid grid-cols-3 gap-2 text-center items-center">
            {/* 1. ML Recommendation */}
            <div className="bg-slate-900/80 p-2 rounded border border-slate-700">
              <span className="text-[10px] text-purple-400 block mb-0.5 font-sans font-semibold">1. AI Optimizer</span>
              <span className="text-sm font-bold text-white">{recommendedFan}% Fan</span>
            </div>

            {/* 2. Safety Gate */}
            <div className={`p-2 rounded border ${isOverridden ? 'bg-rose-950/60 border-rose-500/60' : 'bg-emerald-950/40 border-emerald-500/40'}`}>
              <span className="text-[10px] block mb-0.5 font-sans font-semibold text-slate-300">2. Safety Gate</span>
              <span className={`text-xs font-bold ${isOverridden ? 'text-rose-300' : 'text-emerald-400'}`}>
                {isOverridden ? 'OVERRIDE' : 'VERIFIED'}
              </span>
            </div>

            {/* 3. Physical Actuator */}
            <div className="bg-slate-900/80 p-2 rounded border border-cyan-500/40 glow-cyan">
              <span className="text-[10px] text-cyan-400 block mb-0.5 font-sans font-semibold">3. Actuator PWM</span>
              <span className="text-sm font-bold text-cyan-300">{sanctionedFan}% Fan</span>
            </div>
          </div>
        </div>

        {/* Explainability Dialogue Box */}
        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 mb-3">
          <div className="flex items-center space-x-1.5 text-xs text-cyan-400 font-semibold mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why this cooling level?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {reasonText}
          </p>
        </div>

        {/* Future Thermal Forecast Array */}
        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-slate-400">ML Predicted Trajectory:</span>
            <span className="text-slate-400">Confidence: <strong className="text-white">{confidence}%</strong></span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-[#0b121e] p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">+5 Min</span>
              <span className="text-xs font-bold text-cyan-300">{pred5m}°C</span>
            </div>
            <div className="bg-[#0b121e] p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">+10 Min</span>
              <span className="text-xs font-bold text-cyan-300">{pred10m}°C</span>
            </div>
            <div className="bg-[#0b121e] p-1.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 block">+15 Min</span>
              <span className="text-xs font-bold text-cyan-300">{pred15m}°C</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Hard Limit: <strong>27.0°C</strong></span>
        <span>Safety Buffer: <strong className={safetyMargin < 0.5 ? 'text-rose-400' : 'text-emerald-400'}>{safetyMargin}°C</strong></span>
        <span>Mode: <strong className="text-cyan-400">{state?.control_mode || 'AI_PREDICTIVE'}</strong></span>
      </div>
    </div>
  );
}
