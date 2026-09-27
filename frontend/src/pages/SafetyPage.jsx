import React from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Radio, 
  CheckCircle2, XCircle, Thermometer, Activity, Layers, Lock
} from 'lucide-react';

export default function SafetyPage({ state, onSelectScenario }) {
  const safetyStatus = state?.safety_status || {};
  const racks = state?.racks || [];
  const primaryDecision = state?.primary_decision || {};
  const safety = primaryDecision?.safety || {};

  const mechanisms = [
    {
      num: 1,
      title: 'Hard Temperature Limit',
      rule: 'Current Temperature > 27.0°C',
      action: 'Immediate Override to 100% Cooling Fan Speed',
      description: 'Physical safety boundary strictly enforced at firmware and edge level. AI optimization is immediately revoked and cooling plant operates at maximum capacity to prevent thermal degradation or hardware damage.',
      currentStatus: safetyStatus.hard_limit === 'CRITICAL' ? 'FAIL' : 'PASS',
      severity: safetyStatus.hard_limit === 'CRITICAL' ? 'critical' : 'pass',
      testScenario: 'HIGH_LOAD'
    },
    {
      num: 2,
      title: 'Temperature Rate-of-Rise Preemption',
      rule: 'dT/dt ≥ 0.25°C per interval',
      action: 'Preemptively Boost Fan to ≥82%',
      description: 'Recognizes thermal inertia and steep gradients before temperatures violate absolute ceilings. Triggers preemptive cooling to arrest thermal runaway early.',
      currentStatus: safetyStatus.rate_of_rise === 'WARNING' ? 'WARNING' : 'PASS',
      severity: safetyStatus.rate_of_rise === 'WARNING' ? 'warning' : 'pass',
      testScenario: 'SUDDEN_SPIKE'
    },
    {
      num: 3,
      title: 'Prediction Confidence Gating',
      rule: 'Confidence < 60% (Safe Floor 75%) | 60-85% (Conservative +8% Buffer)',
      action: 'Restricts Aggressive Down-scaling',
      description: 'Quantifies model uncertainty. When computational workload anomalies cause prediction uncertainty, the system prohibits aggressive cooling cutbacks.',
      currentStatus: (safetyStatus.prediction_confidence === 'WARNING' || safetyStatus.prediction_confidence === 'FAIL') ? 'WARNING' : 'PASS',
      severity: safetyStatus.prediction_confidence === 'FAIL' ? 'critical' : safetyStatus.prediction_confidence === 'WARNING' ? 'warning' : 'pass',
      testScenario: 'ML_FAILURE'
    },
    {
      num: 4,
      title: 'Sensor Redundancy & Anomaly Detection',
      rule: '|Sensor - Median| > 2.5°C across 3 probes',
      action: 'Isolate Outlier Probe, Employ Median Value',
      description: 'Each server rack features 3 redundant thermal probes (Sensor A, Sensor B, Sensor C). If one probe reports a drifted or corrupted value (e.g. 38.5°C), the outlier is flagged and closed-loop control relies on verified median consensus.',
      currentStatus: safetyStatus.sensor_health === 'SENSOR_FAULT' ? 'FAULT' : 'PASS',
      severity: safetyStatus.sensor_health === 'SENSOR_FAULT' ? 'warning' : 'pass',
      testScenario: 'SENSOR_FAILURE'
    },
    {
      num: 5,
      title: 'Fail-Safe Mode (Network & Broker Loss)',
      rule: 'MQTT Broker Disconnect, Gateway Timeout, or Sensor Failure',
      action: 'Disengage AI Control, Fallback to 80% Cooling',
      description: 'Upon telemetry disruption, the control system enters a deterministic fail-safe mode. AI recommendation engine is decoupled and physical actuators default to safe operating speeds.',
      currentStatus: safetyStatus.network === 'FAIL' ? 'ACTIVE' : 'STANDBY',
      severity: safetyStatus.network === 'FAIL' ? 'critical' : 'pass',
      testScenario: 'NETWORK_FAILURE'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="glass-panel p-5 rounded-xl border border-datacenter-border">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Multi-Tier Safety Architecture & Guardrails
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic priority hierarchy guaranteeing safety limits are never compromised by AI optimization.
            </p>
          </div>
        </div>

        {/* Priority Flow Diagram */}
        <div className="mt-4 p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <span className="text-slate-500 block mb-2 font-sans font-semibold">Strict Override Priority Hierarchy:</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-1 rounded bg-rose-950/80 border border-rose-600 text-rose-300 font-bold">1. Emergency Hard Limit</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-purple-950/80 border border-purple-600 text-purple-300 font-bold">2. Sensor Consensus</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-amber-950/80 border border-amber-600 text-amber-300 font-bold">3. Fail-Safe Fallback</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-blue-950/80 border border-blue-600 text-blue-300 font-bold">4. Rate-of-Rise Preemption</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-indigo-950/80 border border-indigo-600 text-indigo-300 font-bold">5. ML Confidence Gate</span>
            <span>→</span>
            <span className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold">6. Energy Optimizer</span>
          </div>
        </div>
      </div>

      {/* Safety Mechanisms Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mechanisms.map((mech) => {
          let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          if (mech.severity === 'critical') badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse';
          else if (mech.severity === 'warning') badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/50';

          return (
            <div
              key={mech.num}
              className="glass-panel p-4 rounded-xl border border-datacenter-border flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
                    MECHANISM #{mech.num}
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded font-bold border ${badgeClass}`}>
                    {mech.currentStatus}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5">{mech.title}</h3>
                
                <div className="bg-slate-900/80 rounded p-2 border border-slate-800 text-[11px] font-mono text-slate-300 mb-2">
                  <div className="text-slate-400">Trigger Rule:</div>
                  <div className="text-amber-300 font-semibold">{mech.rule}</div>
                  <div className="text-slate-400 mt-1">Enforced Action:</div>
                  <div className="text-cyan-300 font-semibold">{mech.action}</div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans mb-3">
                  {mech.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Simulate Fault:</span>
                <button
                  onClick={() => onSelectScenario(mech.testScenario)}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-cyan-500 hover:text-black text-cyan-300 border border-slate-700 transition-colors"
                >
                  Test Rule #{mech.num}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Rack Sensor Redundancy Inspector */}
      <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          Live Redundant Sensor Probe Consensus Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">RACK ID</th>
                <th className="pb-2">PROBE A (TOP)</th>
                <th className="pb-2">PROBE B (MID)</th>
                <th className="pb-2">PROBE C (BOT)</th>
                <th className="pb-2">MEDIAN VALUE</th>
                <th className="pb-2">STATUS</th>
                <th className="pb-2">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {racks.map((r) => {
                const isFault = r.sensor_b_fault;
                return (
                  <tr key={r.rack_id} className={isFault ? 'bg-rose-950/20 text-rose-300' : 'text-slate-300'}>
                    <td className="py-2.5 font-bold text-white">{r.rack_id}</td>
                    <td className="py-2.5">{r.sensor_a}°C</td>
                    <td className="py-2.5">
                      <span className={isFault ? 'px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500 font-bold text-rose-400 animate-pulse' : ''}>
                        {r.sensor_b}°C
                      </span>
                    </td>
                    <td className="py-2.5">{r.sensor_c}°C</td>
                    <td className="py-2.5 font-bold text-cyan-400">{r.temperature}°C</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isFault ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {isFault ? 'ANOMALY DETECTED' : 'SYNCHRONIZED'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {isFault ? 'Probe B Isolated. Controlling with Median.' : 'Verified compliant'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
