import React from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, Radio, 
  CheckCircle2, XCircle, Activity, Thermometer
} from 'lucide-react';

export default function SafetyMonitor({ state }) {
  const safetyStatus = state?.safety_status || {};
  const isHardLimitFail = safetyStatus.hard_limit === 'CRITICAL';
  const isRateWarning = safetyStatus.rate_of_rise === 'WARNING';
  const isSensorFault = safetyStatus.sensor_health === 'SENSOR_FAULT';
  const isConfidenceWarn = safetyStatus.prediction_confidence === 'WARNING' || safetyStatus.prediction_confidence === 'FAIL';
  const isNetworkFail = safetyStatus.network === 'FAIL';
  const isFailsafeActive = safetyStatus.fail_safe === 'ACTIVE';

  const checks = [
    {
      id: 'hard_limit',
      title: 'Hard Temperature Limit',
      detail: 'T < 27.0°C Emergency Threshold',
      status: isHardLimitFail ? 'FAIL' : 'PASS',
      type: isHardLimitFail ? 'critical' : 'ok',
      msg: isHardLimitFail ? 'Limit breached! 100% cooling forced.' : 'Nominal (<27°C)'
    },
    {
      id: 'rate_of_rise',
      title: 'Rate-of-Rise Monitor',
      detail: 'dT/dt < 0.25°C/interval',
      status: isRateWarning ? 'WARN' : 'PASS',
      type: isRateWarning ? 'warning' : 'ok',
      msg: isRateWarning ? 'Thermal surge! Preemptive boost.' : 'Stable thermal gradient'
    },
    {
      id: 'sensor_health',
      title: 'Sensor Redundancy',
      detail: '3x Median Isolation Filter',
      status: isSensorFault ? 'FAULT' : 'PASS',
      type: isSensorFault ? 'warning' : 'ok',
      msg: isSensorFault ? 'Outlier detected! Median voting active.' : 'Probes synchronized (±0.2°C)'
    },
    {
      id: 'prediction_confidence',
      title: 'ML Confidence Gate',
      detail: '>60% Min / >85% Full Opt',
      status: isConfidenceWarn ? 'WARN' : 'PASS',
      type: isConfidenceWarn ? 'warning' : 'ok',
      msg: isConfidenceWarn ? 'Low confidence! Conservative floor.' : 'High confidence (>85%)'
    },
    {
      id: 'network',
      title: 'MQTT / Gateway Link',
      detail: 'IoT Message Broker Connection',
      status: isNetworkFail ? 'DISC' : 'PASS',
      type: isNetworkFail ? 'critical' : 'ok',
      msg: isNetworkFail ? 'Broker lost! Fail-Safe engaged.' : 'Connected QoS 1'
    },
    {
      id: 'fail_safe',
      title: 'Fail-Safe Fallback',
      detail: 'Conservative 80% Fan Control',
      status: isFailsafeActive ? 'ACTIVE' : 'READY',
      type: isFailsafeActive ? 'warning' : 'ok',
      msg: isFailsafeActive ? 'Fallback cooling in control.' : 'Standby ready'
    }
  ];

  return (
    <div className="glass-panel p-4 rounded-xl border border-datacenter-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
            Multi-Tier Safety Guardrails
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Safety Overrides AI
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {checks.map((item) => {
          let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
          let Icon = CheckCircle2;

          if (item.type === 'critical') {
            badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse';
            Icon = XCircle;
          } else if (item.type === 'warning') {
            badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={item.id}
              className="bg-slate-900/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-300 truncate">{item.title}</span>
                  <Icon className={`w-3.5 h-3.5 ${
                    item.type === 'critical' ? 'text-rose-400' : item.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono mb-2">{item.detail}</div>
              </div>

              <div>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}>
                  {item.status}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{item.msg}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
