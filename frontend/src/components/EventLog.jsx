import React from 'react';
import { Terminal, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export default function EventLog({ events }) {
  const list = events || [];

  return (
    <div className="glass-panel p-4 rounded-xl border border-datacenter-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold tracking-wide text-white uppercase">
            Closed-Loop Event Audit Log
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Live Telemetry Feed</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 max-h-56 pr-1 font-mono text-xs">
        {list.length === 0 ? (
          <div className="text-center text-slate-500 py-6">No events logged yet.</div>
        ) : (
          list.map((ev) => {
            let Icon = Info;
            let color = 'text-cyan-400';
            let border = 'border-slate-800';

            if (ev.severity === 'CRITICAL') {
              Icon = ShieldAlert;
              color = 'text-rose-400';
              border = 'border-rose-900/60 bg-rose-950/20';
            } else if (ev.severity === 'WARNING') {
              Icon = AlertTriangle;
              color = 'text-amber-400';
              border = 'border-amber-900/60 bg-amber-950/20';
            }

            return (
              <div
                key={ev.id || `${ev.timestamp}-${Math.random()}`}
                className={`p-2 rounded bg-slate-900/80 border ${border} transition-all`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <Icon className={`w-3 h-3 ${color}`} />
                    <strong className={color}>{ev.source || 'SYSTEM'}</strong>
                  </span>
                  <span>{ev.timestamp}</span>
                </div>
                <p className="text-slate-200 text-[11px] leading-snug">{ev.description}</p>
                {ev.action && (
                  <div className="mt-1 text-[10px] text-cyan-300/80">
                    Action: <em>{ev.action}</em>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
